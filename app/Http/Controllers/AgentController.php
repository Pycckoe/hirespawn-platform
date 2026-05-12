<?php

namespace App\Http\Controllers;

use App\Models\Agent;
use App\Models\AgentCategory;
use Inertia\Inertia;
use Inertia\Response;

class AgentController extends Controller
{
    public function index(): Response
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

        return Inertia::render('Catalog', [
            'agents' => $agents,
            'categories' => $categories,
        ]);
    }

    public function show(Agent $agent): Response
    {
        $agent->load(['category', 'seller', 'pricingTiers', 'screenshots', 'reviews.buyer']);

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

        return Inertia::render('AgentDetail', [
            'relatedAgents' => $related,
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
