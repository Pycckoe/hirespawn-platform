<?php

namespace App\Http\Controllers;

use App\Models\ApiKey;
use App\Models\Invoice;
use App\Models\OauthApp;
use App\Models\Subscription;
use App\Models\UsageEvent;
use App\Models\WorkspaceMember;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class ConsoleController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $subscriptions = $user
            ? $user->subscriptions()
                ->with(['agent.category'])
                ->get()
            : collect();

        $subIds = $subscriptions->pluck('id')->all();
        $now = Carbon::now();

        $usageQuery = UsageEvent::query()->whereIn('subscription_id', $subIds);

        $burn24h = (int) (clone $usageQuery)
            ->where('recorded_at', '>=', $now->copy()->subDay())
            ->sum('power_consumed');

        $burn30d = (int) (clone $usageQuery)
            ->where('recorded_at', '>=', $now->copy()->subDays(30))
            ->sum('power_consumed');

        $runs24hPerAgent = (clone $usageQuery)
            ->where('recorded_at', '>=', $now->copy()->subDay())
            ->get()
            ->groupBy('subscription_id');

        // 24h burn series — 24 hourly buckets ending now
        $burnSeries24h = $this->buildSeries(clone $usageQuery, $now->copy()->subHours(24), 24, 'hour');

        // 30d burn series — 30 daily buckets ending today
        $burnSeries30d = $this->buildSeries(clone $usageQuery, $now->copy()->subDays(30), 30, 'day');

        // Last 8 ops events for the live feed. Each row carries a verb +
        // object pulled from the run's metadata so the buyer sees what
        // actually happened — including tool calls the LLM made (each
        // call's name/args/result/success are written by InvokeController
        // into metadata.tool_calls).
        $opsFeed = (clone $usageQuery)
            ->latest('recorded_at')
            ->limit(8)
            ->get()
            ->map(function (UsageEvent $event) use ($subscriptions) {
                $sub = $subscriptions->firstWhere('id', $event->subscription_id);
                $meta = $event->metadata ?? [];
                $toolCalls = collect($meta['tool_calls'] ?? [])->map(fn ($c) => [
                    'name' => $c['name'] ?? '?',
                    // Single-line argument preview so the feed stays compact.
                    'args' => $this->summariseToolArgs($c['arguments'] ?? []),
                    'success' => $c['success'] ?? null,
                    'error' => $c['error'] ?? null,
                    'latencyMs' => $c['latency_ms'] ?? null,
                ])->values()->all();

                // Use the most recent tool call (if any) for the headline
                // verb so the feed reads like a real action log.
                if (! empty($toolCalls)) {
                    $last = end($toolCalls);
                    $verb = str_replace('_', ' ', $last['name']);
                    $obj = $last['args'] ?: '—';
                } else {
                    $verb = 'ran';
                    $obj = $meta['input_preview'] ?? '—';
                }

                return [
                    'agent' => $sub?->agent?->name ?? 'Agent',
                    'verb' => $verb,
                    'obj' => $obj,
                    'cost' => (int) $event->power_consumed,
                    't' => $event->recorded_at?->diffForHumans(['short' => true]) ?? '—',
                    'status' => match (true) {
                        $event->agent_response_status >= 500 => 'fail',
                        $event->agent_response_status >= 400 => 'warn',
                        default => 'ok',
                    },
                    'toolCalls' => $toolCalls,
                ];
            })
            ->values()
            ->all();

        $live = $subscriptions->map(function (Subscription $sub) use ($runs24hPerAgent) {
            $events24h = $runs24hPerAgent->get($sub->id, collect());
            $agent = $sub->agent;

            return [
                'id' => $agent?->slug,
                'name' => $agent?->name,
                'role' => $agent?->role,
                'tone' => $agent?->category?->slug ?? 'sales',
                'power' => (int) ($agent?->power_cost ?? 0),
                'perUnit' => $agent?->per_unit,
                'runs24h' => $events24h->count(),
                'runs7d' => 0,
                'failRate' => $events24h->count() > 0
                    ? $events24h->filter(fn ($e) => $e->agent_response_status >= 400)->count() / $events24h->count()
                    : 0,
                'latency' => $events24h->count() > 0
                    ? round($events24h->avg('latency_ms')).'ms'
                    : '—',
                'spend24h' => (int) $events24h->sum('power_consumed'),
                'status' => $sub->status === 'active' ? 'on' : 'paused',
            ];
        })->values()->all();

        // Real invoices (last 6) + euros spent in the last 30 days.
        // No fallback: when the buyer hasn't paid yet, $billing is [] and
        // the Console renders the "no invoices yet" empty state.
        $billing = [];
        $eurSpent30d = 0;
        if ($user) {
            $billing = Invoice::query()
                ->where('buyer_id', $user->id)
                ->latest('created_at')
                ->limit(6)
                ->get()
                ->map(fn (Invoice $inv) => [
                    'date' => $inv->created_at?->format('M d, Y'),
                    'desc' => $inv->subscription_id
                        ? 'Subscription · '.($inv->subscription?->agent?->name ?? 'agent')
                        : 'Power top-up',
                    'power' => 0,
                    'eur' => round($inv->total_cents / 100, 2),
                    'kind' => $inv->subscription_id ? 'pack' : 'topup',
                    'status' => $inv->status,
                ])
                ->all();

            $eurSpent30d = (int) round(Invoice::query()
                ->where('buyer_id', $user->id)
                ->where('status', 'paid')
                ->where('paid_at', '>=', $now->copy()->subDays(30))
                ->sum('total_cents') / 100);
        }

        // OAuth integrations the user has connected — plus the catalog of
        // available providers so the UI shows both "Connected as X" rows
        // and "Connect [provider]" buttons for the rest. Each agent skill
        // with transport=oauth_proxy uses one of these to call the
        // third-party service on the buyer's behalf at runtime.
        $integrations = OauthApp::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get()
            ->map(function (OauthApp $app) use ($user) {
                $token = $user?->oauthTokenFor($app->provider);

                return [
                    'provider' => $app->provider,
                    'label' => $app->label,
                    'icon' => $app->icon,
                    'scopes' => $app->default_scopes ?? [],
                    'connected' => (bool) $token,
                    'accountLabel' => $token?->account_label,
                    'connectedAt' => $token?->created_at?->format('M d, Y'),
                    'expiresAt' => $token?->expires_at?->format('M d, Y H:i'),
                    'expired' => $token?->isExpired() ?? false,
                ];
            })
            ->values()
            ->all();

        $sidebarCounts = $user ? [
            // Owner counts as 1 + active members
            'team' => 1 + WorkspaceMember::query()
                ->where('owner_id', $user->id)
                ->whereIn('status', ['active', 'invited'])
                ->count(),
            'keys' => ApiKey::query()
                ->where('user_id', $user->id)
                ->whereNull('revoked_at')
                ->count(),
        ] : ['team' => 0, 'keys' => 0];

        return Inertia::render('Console', [
            'subscriptions' => $live,
            'powerBalance' => (int) ($user?->buyerProfile?->power_balance ?? 0),
            'workspaceName' => $user?->buyerProfile?->company_name
                ?? ($user?->name ? "{$user->name}'s workspace" : 'Workspace'),
            'metrics' => [
                'burn24h' => $burn24h,
                'burn30d' => $burn30d,
                'burnSeries24h' => $burnSeries24h,
                'burnSeries30d' => $burnSeries30d,
                'opsFeed' => $opsFeed,
                'eurSpent30d' => $eurSpent30d,
            ],
            'billing' => $billing,
            'integrations' => $integrations,
            'sidebarCounts' => $sidebarCounts,
        ]);
    }

    /**
     * @return array<int>
     */
    /**
     * Turn a tool-call argument array into a one-line preview suitable
     * for the Live Ops feed. Prefers semantically meaningful keys
     * (to/email/message/channel/url) over a raw JSON dump.
     */
    private function summariseToolArgs(array $args): string
    {
        foreach (['to', 'email', 'recipient', 'channel', 'url', 'query', 'message', 'subject'] as $hint) {
            if (! empty($args[$hint]) && (is_string($args[$hint]) || is_numeric($args[$hint]))) {
                return mb_strimwidth((string) $args[$hint], 0, 80, '…');
            }
        }
        $json = json_encode($args, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        return mb_strimwidth($json ?: '—', 0, 80, '…');
    }

    private function buildSeries($baseQuery, Carbon $from, int $buckets, string $unit): array
    {
        $events = (clone $baseQuery)
            ->where('recorded_at', '>=', $from)
            ->get(['power_consumed', 'recorded_at']);

        $stepMinutes = match ($unit) {
            'hour' => 60,
            'day' => 60 * 24,
            default => 60,
        };

        $series = array_fill(0, $buckets, 0);
        $startMs = $from->getTimestamp() * 1000;
        $stepMs = $stepMinutes * 60 * 1000;

        foreach ($events as $event) {
            $eventMs = $event->recorded_at->getTimestamp() * 1000;
            $idx = (int) floor(($eventMs - $startMs) / $stepMs);
            if ($idx >= 0 && $idx < $buckets) {
                $series[$idx] += (int) $event->power_consumed;
            }
        }

        return $series;
    }
}
