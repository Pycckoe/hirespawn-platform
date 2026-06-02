<?php

namespace App\Http\Controllers;

use App\Models\Agent;
use App\Models\AgentCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AgentController extends Controller
{
    public function index(Request $request): Response
    {
        $agents = Agent::query()
            ->with(['category', 'seller'])
            ->where('status', 'approved')
            ->orderByDesc('subscribers_count')
            ->get()
            ->map(fn (Agent $agent) => $this->transformForCard($agent))
            ->values();

        $categories = AgentCategory::query()
            ->orderBy('sort_order')
            ->get(['slug', 'name', 'icon'])
            ->map(fn ($c) => ['key' => $c->slug, 'label' => $c->name, 'icon' => $c->icon])
            ->values();

        // Buyer context — when authenticated, ship the agents the buyer
        // has already hired (so cards can render a "✓ Hired" badge instead
        // of "Deploy") + their power balance for the topbar.
        $user = $request->user();
        $subscribedSlugs = $user
            ? $user->subscriptions()
                ->with('agent:id,slug')
                ->whereIn('status', ['active', 'paused'])
                ->get()
                ->pluck('agent.slug')
                ->filter()
                ->values()
                ->all()
            : [];

        return Inertia::render('Catalog', [
            'agents' => $agents,
            'categories' => $categories,
            'subscribedSlugs' => $subscribedSlugs,
            'powerBalance' => (int) ($user?->buyerProfile?->power_balance ?? 0),
            'workspaceName' => $user?->buyerProfile?->company_name
                ?? ($user?->name ? "{$user->name}'s workspace" : 'Workspace'),
        ]);
    }

    public function show(Request $request, Agent $agent): Response
    {
        $agent->load(['category', 'seller', 'pricingTiers', 'screenshots', 'reviews.buyer', 'skills', 'settingDefs']);

        $user = $request->user();
        $subscription = $user
            ? $user->subscriptions()
                ->where('agent_id', $agent->id)
                ->whereIn('status', ['active', 'paused'])
                ->first()
            : null;

        // Chat history — last 12 runs against this subscription. Used
        // by the Run panel on /agent/{slug} to render a real conversation
        // (input → output) instead of fire-and-forget.
        $recentRuns = $subscription
            ? \App\Models\UsageEvent::query()
                ->where('subscription_id', $subscription->id)
                ->where('event_type', 'run')
                ->latest('recorded_at')
                ->limit(12)
                ->get()
                ->map(fn ($e) => [
                    'id' => $e->id,
                    'input' => $e->metadata['input_preview'] ?? $e->metadata['input'] ?? '',
                    'output' => $e->metadata['output'] ?? $e->metadata['output_preview'] ?? '',
                    'error' => $e->metadata['error'] ?? null,
                    'ok' => $e->agent_response_status < 400,
                    'cost' => (int) $e->power_consumed,
                    'inputTokens' => (int) ($e->input_tokens ?? 0),
                    'outputTokens' => (int) ($e->output_tokens ?? 0),
                    'latencyMs' => (int) ($e->latency_ms ?? 0),
                    'toolCalls' => $e->metadata['tool_calls'] ?? [],
                    'at' => $e->recorded_at?->diffForHumans() ?? '—',
                ])
                ->reverse() // oldest → newest, chat reads top-to-bottom
                ->values()
                ->all()
            : [];

        $related = Agent::query()
            ->with('category')
            ->where('status', 'approved')
            ->where('id', '!=', $agent->id)
            ->where(function ($query) use ($agent) {
                $query->where('vendor', $agent->vendor)
                    ->orWhere('category_id', $agent->category_id);
            })
            ->orderByDesc('subscribers_count')
            ->limit(4)
            ->get()
            ->map(fn (Agent $a) => $this->transformForCard($a))
            ->values();

        // Pre-hire checklist: every OAuth provider this agent's skills
        // require + whether the buyer already has a connected token for
        // it. Used by the UI to show "Connect Slack to run" warnings.
        $requiredProviders = $agent->skills
            ->where('transport', 'oauth_proxy')
            ->pluck('required_oauth_provider')
            ->filter()
            ->unique()
            ->values();

        $oauthChecklist = $requiredProviders->map(function (string $provider) use ($user) {
            $token = $user?->oauthTokenFor($provider);

            return [
                'provider' => $provider,
                'connected' => (bool) $token,
                'accountLabel' => $token?->account_label,
                'expired' => $token?->isExpired() ?? false,
            ];
        })->all();

        return Inertia::render('AgentDetail', [
            'relatedAgents' => $related,
            'subscription' => $subscription ? [
                'id' => $subscription->id,
                'status' => $subscription->status,
                'startedAt' => $subscription->started_at?->format('M d, Y'),
            ] : null,
            'isSubscribed' => (bool) $subscription,
            'isAuthenticated' => (bool) $user,
            'oauthChecklist' => $oauthChecklist,
            'recentRuns' => $recentRuns,
            // settingDefs ship to UI so we can show buyers what they
            // need to configure before hiring (and after, deep-link
            // to the configure page). `value` is the buyer's saved value
            // for THIS subscription (null when not yet configured) so the
            // checklist can show "✓ set" instead of a perpetual "required".
            'settingDefs' => $agent->settingDefs->map(function ($d) use ($subscription) {
                $settings = (array) ($subscription?->settings ?? []);

                return [
                    'key' => $d->key,
                    'label' => $d->label,
                    'type' => $d->type,
                    'isRequired' => (bool) $d->is_required,
                    'description' => $d->description,
                    'value' => $settings[$d->key] ?? null,
                ];
            })->values(),
            'skills' => $agent->skills->map(fn ($s) => [
                'name' => $s->name,
                'label' => $s->label,
                'description' => $s->description,
                'transport' => $s->transport,
                'requiredOauthProvider' => $s->required_oauth_provider,
            ])->values(),
            'powerBalance' => (int) ($user?->buyerProfile?->power_balance ?? 0),
            'workspaceName' => $user?->buyerProfile?->company_name
                ?? ($user?->name ? "{$user->name}'s workspace" : 'Workspace'),
            'agent' => array_merge($this->transformForCard($agent), [
                'description' => $agent->description,
                'manifestUrl' => $agent->manifest_url,
                'slaUptime' => (float) $agent->sla_uptime_pct,
                'pricingTiers' => $agent->pricingTiers->map(fn ($t) => [
                    'id' => $t->id,
                    'name' => $t->name,
                    'priceCents' => $t->price_cents,
                    'currency' => $t->currency,
                    'includedUnits' => $t->included_units,
                    'unitName' => $t->unit_name,
                    'overagePriceCents' => $t->overage_price_cents,
                    'features' => $t->features ?? [],
                ])->values(),
                'screenshots' => $agent->screenshots->map(fn ($s) => [
                    'url' => $s->url,
                    'caption' => $s->caption,
                    'type' => $s->type,
                ])->values(),
                'reviews' => $agent->reviews
                    ->where('status', 'published')
                    ->map(fn ($r) => [
                        'id' => $r->id,
                        'rating' => $r->rating,
                        'title' => $r->title,
                        'body' => $r->body,
                        'buyerName' => $r->buyer?->name,
                        'publishedAt' => $r->published_at?->toIso8601String(),
                    ])->values(),
            ]),
            'agentId' => $agent->slug,
        ]);
    }

    /**
     * Map an Agent model to the shape the original design's JSX expects
     * (matches the AGENTS constant in resources/js/lib/shared.jsx).
     */
    private function transformForCard(Agent $agent): array
    {
        return [
            'id' => $agent->slug,
            'name' => $agent->name,
            'role' => $agent->role,
            'rank' => $agent->rank,
            'vendor' => $agent->vendor,
            'power' => $agent->power_cost,
            'perUnit' => $agent->per_unit,
            'rating' => (float) $agent->rating_avg,
            'deployed' => $agent->subscribers_count,
            'langs' => $agent->languages ?? [],
            'tone' => $agent->category?->slug ?? 'sales',
            'int' => $agent->integrations ?? [],
            'spec' => $agent->spec ?? $agent->tagline ?? '',
        ];
    }
}
