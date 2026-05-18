<?php

namespace App\Http\Controllers;

use App\Models\Agent;
use App\Models\AgentCategory;
use App\Models\LlmModel;
use App\Support\Rates;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class VendorPublishController extends Controller
{
    /**
     * Rank options surfaced in the publish form — the Hirespawn design
     * uses military-style rank tags (E for enlisted, O for officer).
     */
    private const RANK_OPTIONS = ['E-5', 'E-6', 'E-7', 'O-2', 'O-3', 'O-4', 'O-5'];

    public function create(Request $request): Response
    {
        $user = $request->user();
        $defaultVendor = $user?->buyerProfile?->company_name
            ?? $user?->sellerProfile?->company_name
            ?? ($user?->name ? "{$user->name} Studio" : 'Independent Studio');

        return Inertia::render('VendorPublish', $this->formProps(
            mode: 'create',
            request: $request,
            defaults: [
                'vendor' => $defaultVendor,
                'currency' => 'EUR',
                'rank' => 'E-6',
                'languages' => ['EN'],
                'integrations' => [],
                'systemPrompt' => '',
                'estInputTokens' => 800,
                'estOutputTokens' => 400,
                'maxOutputTokens' => null,
            ],
        ));
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validated($request);
        $category = AgentCategory::where('slug', $validated['category'])->firstOrFail();
        $user = $request->user();

        $agent = Agent::create([
            'seller_id' => $user->id,
            'category_id' => $category->id,
            'llm_model_id' => $validated['llmModelId'] ?? null,
            'slug' => $this->uniqueSlugFor($validated['name']),
            'name' => $validated['name'],
            'vendor' => $validated['vendor'],
            'role' => $validated['role'],
            'rank' => $validated['rank'],
            'tagline' => $validated['tagline'],
            'spec' => $validated['tagline'],
            'description' => $validated['description'],
            'system_prompt' => $validated['systemPrompt'] ?? null,
            // New listings enter the admin review queue. Auto-approval is
            // gone — an admin has to click Approve before the agent is
            // visible in the catalog.
            'status' => 'pending_review',
            'pricing_model' => 'usage_based',
            'power_cost' => $validated['powerCost'],
            'per_unit' => $validated['perUnit'],
            'est_input_tokens' => $validated['estInputTokens'] ?? 0,
            'est_output_tokens' => $validated['estOutputTokens'] ?? 0,
            'max_output_tokens' => $validated['maxOutputTokens'] ?? null,
            'currency' => 'EUR',
            'rating_avg' => 0,
            'subscribers_count' => 0,
            'languages' => $this->normalizeArray($validated['languages'] ?? []),
            'integrations' => $this->normalizeArray($validated['integrations'] ?? [], lower: true),
            'sla_uptime_pct' => 99.0,
            'published_at' => null,
        ]);

        return redirect()
            ->route('vendor')
            ->with('status', "Submitted {$agent->name} for review. We'll notify you when it goes live.");
    }

    public function edit(Request $request, Agent $agent): Response
    {
        $this->authorizeAgent($request, $agent);

        return Inertia::render('VendorPublish', $this->formProps(
            mode: 'edit',
            request: $request,
            agent: $agent,
        ));
    }

    public function update(Request $request, Agent $agent): RedirectResponse
    {
        $this->authorizeAgent($request, $agent);

        $validated = $this->validated($request);
        $category = AgentCategory::where('slug', $validated['category'])->firstOrFail();

        $agent->forceFill([
            'category_id' => $category->id,
            'llm_model_id' => $validated['llmModelId'] ?? null,
            'name' => $validated['name'],
            'vendor' => $validated['vendor'],
            'role' => $validated['role'],
            'rank' => $validated['rank'],
            'tagline' => $validated['tagline'],
            'spec' => $validated['tagline'],
            'description' => $validated['description'],
            'system_prompt' => $validated['systemPrompt'] ?? null,
            'power_cost' => $validated['powerCost'],
            'per_unit' => $validated['perUnit'],
            'est_input_tokens' => $validated['estInputTokens'] ?? 0,
            'est_output_tokens' => $validated['estOutputTokens'] ?? 0,
            'max_output_tokens' => $validated['maxOutputTokens'] ?? null,
            'languages' => $this->normalizeArray($validated['languages'] ?? []),
            'integrations' => $this->normalizeArray($validated['integrations'] ?? [], lower: true),
        ])->save();

        return redirect()
            ->route('vendor')
            ->with('status', "Saved changes to {$agent->name}.");
    }

    private function formProps(string $mode, Request $request, ?Agent $agent = null, array $defaults = []): array
    {
        $user = $request->user();

        // Available LLM models for the picker. Cheapest first within each
        // provider so the dropdown groups read sensibly.
        $models = LlmModel::query()
            ->where('is_active', true)
            ->orderBy('provider')
            ->orderBy('sort_order')
            ->orderBy('input_price_cents_per_1m')
            ->get()
            ->map(fn (LlmModel $m) => [
                'id' => $m->id,
                'provider' => $m->provider,
                'slug' => $m->slug,
                'name' => $m->name,
                'apiId' => $m->api_id,
                'inputPriceCentsPer1m' => (int) $m->input_price_cents_per_1m,
                'outputPriceCentsPer1m' => (int) $m->output_price_cents_per_1m,
                'contextWindow' => (int) $m->context_window,
                'maxOutputTokens' => (int) $m->max_output_tokens,
                'capabilities' => $m->capabilities ?? [],
                'description' => $m->description,
            ])
            ->values()
            ->all();

        // Provider → credential summary for the form. Lets the JS show
        // "✓ key on file" vs "⚠ no key — agent will fail invocations".
        $credentialsByProvider = $user
            ? $user->llmCredentials()->get()->mapWithKeys(fn ($c) => [
                $c->provider => [
                    'id' => $c->id,
                    'label' => $c->label,
                    'last4' => $c->last4,
                    'verifiedAt' => $c->verified_at?->toIso8601String(),
                ],
            ])->all()
            : [];

        return [
            'categories' => AgentCategory::query()
                ->orderBy('sort_order')
                ->get(['slug', 'name', 'icon'])
                ->map(fn ($c) => ['slug' => $c->slug, 'label' => $c->name, 'icon' => $c->icon])
                ->values()
                ->all(),
            'ranks' => self::RANK_OPTIONS,
            'mode' => $mode,
            'llmModels' => $models,
            'credentialsByProvider' => $credentialsByProvider,
            // Platform-wide economics — drives the live margin calculator.
            'economics' => [
                'eurCentsPerPower' => Rates::eurCentsPerPower(),
                'sellerSharePct' => Rates::sellerSharePct(),
            ],
            'agent' => $agent ? [
                'slug' => $agent->slug,
                'name' => $agent->name,
                'vendor' => $agent->vendor,
                'category' => $agent->category?->slug,
                'role' => $agent->role,
                'rank' => $agent->rank,
                'tagline' => $agent->tagline,
                'description' => $agent->description,
                'systemPrompt' => $agent->system_prompt ?? '',
                'powerCost' => (int) $agent->power_cost,
                'perUnit' => $agent->per_unit,
                'llmModelId' => $agent->llm_model_id,
                'estInputTokens' => (int) $agent->est_input_tokens,
                'estOutputTokens' => (int) $agent->est_output_tokens,
                'maxOutputTokens' => $agent->max_output_tokens,
                'languages' => $agent->languages ?? [],
                'integrations' => $agent->integrations ?? [],
                'status' => $agent->status,
            ] : null,
            'defaults' => $defaults,
        ];
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'vendor' => ['required', 'string', 'max:80'],
            'category' => ['required', 'string', 'exists:agent_categories,slug'],
            'role' => ['required', 'string', 'max:80'],
            'rank' => ['required', 'string', 'max:8'],
            'tagline' => ['required', 'string', 'max:120'],
            'description' => ['required', 'string', 'max:4000'],
            'systemPrompt' => ['nullable', 'string', 'max:8000'],
            'powerCost' => ['required', 'integer', 'min:1', 'max:10000'],
            'perUnit' => ['required', 'string', 'max:60'],
            'llmModelId' => ['nullable', 'integer', Rule::exists('llm_models', 'id')->where('is_active', true)],
            'estInputTokens' => ['nullable', 'integer', 'min:0', 'max:1000000'],
            'estOutputTokens' => ['nullable', 'integer', 'min:0', 'max:1000000'],
            'maxOutputTokens' => ['nullable', 'integer', 'min:1', 'max:200000'],
            'languages' => ['nullable', 'array', 'max:12'],
            'languages.*' => ['string', 'max:6'],
            'integrations' => ['nullable', 'array', 'max:24'],
            'integrations.*' => ['string', 'max:32'],
        ]);
    }

    /**
     * Only the agent's owner (or an admin) can edit it.
     */
    private function authorizeAgent(Request $request, Agent $agent): void
    {
        $user = $request->user();
        if (! $user || ($user->id !== $agent->seller_id && ! $user->is_admin)) {
            abort(403, 'Not your listing.');
        }
    }

    /**
     * Slugify the name and append -2, -3, ... until we hit an unused slug.
     */
    private function uniqueSlugFor(string $name): string
    {
        $base = Str::slug($name) ?: 'agent';
        $candidate = $base;
        $i = 2;

        while (Agent::where('slug', $candidate)->exists()) {
            $candidate = "{$base}-{$i}";
            $i++;
        }

        return $candidate;
    }

    private function normalizeArray(array $values, bool $lower = false): array
    {
        $mapped = array_map(fn ($v) => trim((string) $v), $values);
        if ($lower) {
            $mapped = array_map(fn ($v) => strtolower($v), $mapped);
        }
        $mapped = array_filter($mapped, fn ($v) => $v !== '');

        return array_values(array_unique($mapped));
    }
}
