<?php

namespace App\Http\Controllers;

use App\Models\Agent;
use App\Models\LlmModel;
use App\Models\Payout;
use App\Models\PayoutMethod;
use App\Models\Subscription;
use App\Models\UsageEvent;
use App\Support\Rates;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class VendorController extends Controller
{

    public function index(Request $request): Response
    {
        $user = $request->user();

        $ownedAgents = $user
            ? $user->ownedAgents()->with('category')->get()
            : collect();

        $agentIds = $ownedAgents->pluck('id')->all();

        // All usage events on this seller's agents in the last 30 days.
        $events30d = $agentIds
            ? UsageEvent::query()
                ->whereHas('subscription', fn ($q) => $q->whereIn('agent_id', $agentIds))
                ->where('recorded_at', '>=', Carbon::now()->subDays(30))
                ->with('subscription:id,agent_id')
                ->get()
            : collect();

        $usageByAgent = $events30d->groupBy(fn ($e) => $e->subscription?->agent_id);
        $activeSubsByAgent = $ownedAgents->isEmpty()
            ? collect()
            : Subscription::query()
                ->whereIn('agent_id', $agentIds)
                ->where('status', 'active')
                ->get()
                ->groupBy('agent_id');

        $listings = $ownedAgents
            ->map(fn (Agent $agent) => $this->transformListing($agent, $usageByAgent->get($agent->id, collect()), $activeSubsByAgent->get($agent->id, collect())->count()))
            ->values()
            ->all();

        $payouts = $user
            ? $user->payouts()
                ->latest('id')
                ->limit(12)
                ->get()
                ->map(fn (Payout $payout) => $this->transformPayout($payout))
                ->values()
                ->all()
            : [];

        $totalPower30d = (int) $events30d->sum('power_consumed');
        $sellerEur30d = (int) round(Rates::sellerEarnedCents($totalPower30d) / 100);

        $payoutMethods = $user
            ? $user->payoutMethods()
                ->orderByDesc('is_default')
                ->latest('id')
                ->get()
                ->map(fn (PayoutMethod $m) => $this->transformMethod($m))
                ->values()
                ->all()
            : [];

        $cashOut = $this->cashOutSummary($user, $agentIds);

        $now = Carbon::now();
        $revSeries24h = $this->buildPowerSeries($events30d, $now->copy()->subHours(24), 24, 'hour');
        $revSeries7d = $this->buildPowerSeries($events30d, $now->copy()->subDays(7), 7, 'day');
        $revSeries30d = $this->buildPowerSeries($events30d, $now->copy()->subDays(30), 30, 'day');

        $subs = $user && $agentIds
            ? Subscription::query()
                ->whereIn('agent_id', $agentIds)
                ->where('status', 'active')
                ->with(['agent:id,name,slug,power_cost', 'buyer:id,name,email,created_at'])
                ->get()
                ->map(function (Subscription $sub) use ($events30d) {
                    $subEvents = $events30d->where('subscription_id', $sub->id);
                    $rev30d = (int) $subEvents->sum('power_consumed');

                    return [
                        'customer' => $sub->buyer?->name ?? 'Customer',
                        'seat' => $sub->buyer?->email ?? '—',
                        'plan' => 'Pro',
                        'listings' => $sub->agent ? [$sub->agent->name] : [],
                        'mrr' => $rev30d,
                        'rev30d' => $rev30d,
                        'since' => $sub->buyer?->created_at?->format('M Y') ?? '—',
                        'status' => 'healthy',
                        'trend' => array_fill(0, 11, $rev30d > 0 ? max(1, intdiv($rev30d, 11)) : 0),
                    ];
                })
                ->values()
                ->all()
            : [];

        // Derive per-listing performance directly from the transformed listings.
        $perf = collect($listings)->map(fn ($l) => [
            'listing' => $l['name'],
            'runs' => $l['runs30d'],
            'success' => $l['runs30d'] > 0 ? 99.5 : 0.0,
            'avgLatency' => $l['runs30d'] > 0 ? '—' : '—',
            'rating' => $l['rating'] ?? 0,
        ])->all();

        $llmCredentials = $user
            ? $user->llmCredentials()
                ->get()
                ->map(fn ($c) => [
                    'id' => $c->id,
                    'provider' => $c->provider,
                    'label' => $c->label,
                    'last4' => $c->last4,
                    'verifiedAt' => $c->verified_at?->format('M d, Y H:i'),
                    'lastUsedAt' => $c->last_used_at?->format('M d, Y H:i'),
                    'createdAt' => $c->created_at?->format('M d, Y'),
                ])
                ->values()
                ->all()
            : [];

        // List of providers present in the catalog — drives the
        // "Add credential" form's provider <select>.
        $llmProviders = LlmModel::query()
            ->where('is_active', true)
            ->distinct()
            ->orderBy('provider')
            ->pluck('provider')
            ->all();

        return Inertia::render('Vendor', [
            'listings' => $listings,
            'payouts' => $payouts,
            'payoutMethods' => $payoutMethods,
            'cashOut' => $cashOut,
            'subs' => $subs,
            'disputes' => [],
            'perf' => $perf,
            'llmCredentials' => $llmCredentials,
            'llmProviders' => $llmProviders,
            'metrics' => [
                'powerEarned30d' => $totalPower30d,
                'eurEarned30d' => $sellerEur30d,
                'activeSubs' => (int) $activeSubsByAgent->flatten()->count(),
                'totalRuns30d' => $events30d->count(),
                'avgRating' => $this->avgRating($ownedAgents),
                'revSeries24h' => $revSeries24h,
                'revSeries7d' => $revSeries7d,
                'revSeries30d' => $revSeries30d,
            ],
        ]);
    }

    /**
     * Bucket the given UsageEvent collection into N power-consumed buckets
     * between $from and now. Used for the seller revenue chart.
     *
     * @return array<int>
     */
    private function buildPowerSeries($events, Carbon $from, int $buckets, string $unit): array
    {
        $stepMinutes = $unit === 'hour' ? 60 : 60 * 24;
        $series = array_fill(0, $buckets, 0);
        $startMs = $from->getTimestamp() * 1000;
        $stepMs = $stepMinutes * 60 * 1000;

        foreach ($events as $event) {
            if (! $event->recorded_at || $event->recorded_at->lt($from)) {
                continue;
            }
            $eventMs = $event->recorded_at->getTimestamp() * 1000;
            $idx = (int) floor(($eventMs - $startMs) / $stepMs);
            if ($idx >= 0 && $idx < $buckets) {
                $series[$idx] += (int) $event->power_consumed;
            }
        }

        return $series;
    }

    private function transformMethod(PayoutMethod $m): array
    {
        return [
            'id' => $m->id,
            'type' => $m->type,
            'label' => $m->label,
            'display' => $m->display(),
            'holderName' => $m->holder_name,
            'country' => $m->country,
            'currency' => $m->currency,
            'isDefault' => $m->is_default,
            'verifiedAt' => $m->verified_at?->format('M d, Y'),
            'createdAt' => $m->created_at?->format('M d, Y'),
        ];
    }

    /**
     * Available cents = lifetime earned − already-pending − already-paid.
     */
    private function cashOutSummary($user, array $agentIds): array
    {
        $minCashoutCents = Rates::minCashoutCents();
        $feePercent = Rates::cashoutFeePct();

        if (! $user || empty($agentIds)) {
            return [
                'availableCents' => 0,
                'lifetimeEarnedCents' => 0,
                'pendingCents' => 0,
                'paidCents' => 0,
                'minCashoutCents' => $minCashoutCents,
                'feePercent' => $feePercent,
            ];
        }

        $totalPower = (int) UsageEvent::query()
            ->whereHas('subscription', fn ($q) => $q->whereIn('agent_id', $agentIds))
            ->sum('power_consumed');

        $lifetimeCents = Rates::sellerEarnedCents($totalPower);

        $pendingCents = (int) Payout::query()
            ->where('seller_id', $user->id)
            ->whereIn('status', ['pending', 'processing'])
            ->sum('gross_cents');

        $paidCents = (int) Payout::query()
            ->where('seller_id', $user->id)
            ->where('status', 'paid')
            ->sum('gross_cents');

        return [
            'availableCents' => max(0, $lifetimeCents - $pendingCents - $paidCents),
            'lifetimeEarnedCents' => $lifetimeCents,
            'pendingCents' => $pendingCents,
            'paidCents' => $paidCents,
            'minCashoutCents' => $minCashoutCents,
            'feePercent' => $feePercent,
        ];
    }

    private function transformListing(Agent $agent, $events30d, int $activeSubs): array
    {
        $runs30d = $events30d->count();
        $power30d = (int) $events30d->sum('power_consumed');

        return [
            'id' => $agent->slug,
            'name' => $agent->name,
            'cat' => $agent->category?->name ?? 'Sales',
            'icon' => $agent->category?->icon ?? '◇',
            'power' => (int) $agent->power_cost,
            'perUnit' => $agent->per_unit,
            'status' => match ($agent->status) {
                'approved' => 'live',
                'suspended' => 'paused',
                'pending_review' => 'review',
                'rejected' => 'rejected',
                'draft' => 'draft',
                default => $agent->status,
            },
            'subs' => $activeSubs,
            'runs30d' => $runs30d,
            'rev30d' => $power30d, // raw power earned by this agent over 30d
            'rating' => $agent->rating_avg > 0 ? (float) $agent->rating_avg : null,
            'rev_share' => (int) Rates::sellerSharePct(),
        ];
    }

    private function transformPayout(Payout $payout): array
    {
        return [
            'date' => $payout->paid_at?->format('M d, Y')
                ?? $payout->created_at?->format('M d, Y')
                ?? '—',
            'period' => $payout->period_start?->format('M Y') ?? '—',
            'power' => 0,
            'eur' => intdiv((int) $payout->net_cents, 100),
            'fee' => intdiv((int) $payout->platform_fee_cents, 100),
            'status' => $payout->status,
            'method' => $payout->payment_method,
            'ref' => $payout->reference ?? "PO-{$payout->id}",
        ];
    }

    private function avgRating($agents): float
    {
        $rated = $agents->filter(fn ($a) => $a->rating_avg > 0);
        if ($rated->isEmpty()) {
            return 0.0;
        }

        return round($rated->avg('rating_avg'), 2);
    }
}
