<?php

namespace App\Http\Controllers;

use App\Models\Agent;
use App\Models\AgentCategory;
use App\Models\AgentSettingDef;
use App\Models\AgentSkill;
use App\Models\LlmModel;
use App\Models\OauthApp;
use App\Support\Rates;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class VendorPublishController extends Controller
{
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

        $this->persistSkills($agent, $validated['skills'] ?? []);
        $this->persistSettingDefs($agent, $validated['settingDefs'] ?? []);

        audit('agent.create', $agent, [
            'name' => $agent->name,
            'category' => $category->slug,
            'skills' => count($validated['skills'] ?? []),
            'setting_defs' => count($validated['settingDefs'] ?? []),
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

        $this->persistSkills($agent, $validated['skills'] ?? []);
        $this->persistSettingDefs($agent, $validated['settingDefs'] ?? []);

        audit('agent.update', $agent, [
            'name' => $agent->name,
            'skills' => count($validated['skills'] ?? []),
            'setting_defs' => count($validated['settingDefs'] ?? []),
        ]);

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

        $oauthProviders = OauthApp::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get(['provider', 'label', 'icon'])
            ->map(fn ($a) => ['provider' => $a->provider, 'label' => $a->label, 'icon' => $a->icon])
            ->values()
            ->all();

        // Picker options are admin-managed via /admin/site-settings
        // (group: Agents). The publish form ships them so the JS doesn't
        // need its own list. Empty CMS values fall back to sane defaults.
        $rankOptions = Rates::listSetting('agent_ranks', ['E-5', 'E-6', 'E-7', 'O-2', 'O-3', 'O-4', 'O-5']);
        $knownLanguages = Rates::listSetting('known_languages', ['EN']);
        $knownIntegrationTags = Rates::listSetting('known_integration_tags', []);

        return [
            'categories' => AgentCategory::query()
                ->orderBy('sort_order')
                ->get(['slug', 'name', 'icon'])
                ->map(fn ($c) => ['slug' => $c->slug, 'label' => $c->name, 'icon' => $c->icon])
                ->values()
                ->all(),
            'ranks' => $rankOptions,
            'knownLanguages' => $knownLanguages,
            'knownIntegrationTags' => $knownIntegrationTags,
            'maxSkillsPerAgent' => Rates::maxSkillsPerAgent(),
            'mode' => $mode,
            'llmModels' => $models,
            'credentialsByProvider' => $credentialsByProvider,
            'oauthProviders' => $oauthProviders,
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
                'webhookSecret' => $agent->webhook_secret,
                'skills' => $agent->allSkills()->get()->map(fn (AgentSkill $s) => [
                    'name' => $s->name,
                    'label' => $s->label,
                    'description' => $s->description,
                    'transport' => $s->transport,
                    'webhookUrl' => $s->webhook_url,
                    'requiredOauthProvider' => $s->required_oauth_provider,
                    'parametersSchema' => $s->parameters_schema ? json_encode($s->parameters_schema, JSON_PRETTY_PRINT) : '',
                    'timeoutSeconds' => (int) $s->timeout_seconds,
                ])->values()->all(),
                'settingDefs' => $agent->settingDefs()->get()->map(fn (AgentSettingDef $d) => [
                    'key' => $d->key,
                    'label' => $d->label,
                    'type' => $d->type,
                    'default_value' => $d->default_value,
                    'options' => $d->options ?? [],
                    'is_required' => (bool) $d->is_required,
                    'description' => $d->description,
                ])->values()->all(),
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
            // Skills (a.k.a. tools the LLM can call). One submitted row
            // = one row in agent_skills. The cap is admin-managed via
            // the `max_skills_per_agent` site setting.
            'skills' => ['nullable', 'array', 'max:'.Rates::maxSkillsPerAgent()],
            'skills.*.name' => ['required', 'string', 'max:60', 'regex:/^[a-z][a-z0-9_]*$/i'],
            'skills.*.label' => ['nullable', 'string', 'max:120'],
            'skills.*.description' => ['required', 'string', 'max:2000'],
            'skills.*.transport' => ['required', Rule::in(['webhook', 'builtin', 'oauth_proxy'])],
            'skills.*.webhook_url' => ['nullable', 'url', 'max:500'],
            'skills.*.required_oauth_provider' => ['nullable', 'string', 'max:30', 'exists:oauth_apps,provider'],
            'skills.*.parameters_schema' => ['nullable'],
            'skills.*.timeout_seconds' => ['nullable', 'integer', 'min:1', 'max:300'],
            // Per-deployment settings — variables the buyer will fill
            // in when they subscribe. Substituted into system_prompt at
            // runtime as {{key}}.
            'settingDefs' => ['nullable', 'array', 'max:30'],
            'settingDefs.*.key' => ['required', 'string', 'max:60', 'regex:/^[a-z][a-z0-9_]*$/i'],
            'settingDefs.*.label' => ['required', 'string', 'max:120'],
            'settingDefs.*.type' => ['required', Rule::in(['text', 'textarea', 'select', 'number', 'boolean'])],
            'settingDefs.*.default_value' => ['nullable', 'string', 'max:2000'],
            'settingDefs.*.options' => ['nullable', 'array', 'max:30'],
            'settingDefs.*.options.*' => ['string', 'max:120'],
            'settingDefs.*.is_required' => ['nullable', 'boolean'],
            'settingDefs.*.description' => ['nullable', 'string', 'max:500'],
        ]);
    }

    /**
     * Persist the seller's skill rows for the given agent. Replaces the
     * full set on every save — simpler than diffing add/edit/delete and
     * the seller's view of "publish" is always the canonical list.
     *
     * Generates a fresh webhook_secret on first skill creation so the
     * vendor's backend can verify our outbound HMAC signatures.
     */
    private function persistSkills(Agent $agent, array $skills): void
    {
        DB::transaction(function () use ($agent, $skills) {
            if ($skills && ! $agent->webhook_secret) {
                $agent->forceFill(['webhook_secret' => Str::random(48)])->save();
            }

            $agent->allSkills()->delete();

            foreach ($skills as $i => $s) {
                $schema = $s['parameters_schema'] ?? null;
                if (is_string($schema) && trim($schema) !== '') {
                    $decoded = json_decode($schema, true);
                    $schema = json_last_error() === JSON_ERROR_NONE ? $decoded : null;
                }
                AgentSkill::create([
                    'agent_id' => $agent->id,
                    'name' => strtolower($s['name']),
                    'label' => $s['label'] ?? null,
                    'description' => $s['description'],
                    'parameters_schema' => is_array($schema) ? $schema : null,
                    'transport' => $s['transport'],
                    'webhook_url' => in_array($s['transport'], ['webhook', 'oauth_proxy'], true) ? ($s['webhook_url'] ?? null) : null,
                    'required_oauth_provider' => $s['transport'] === 'oauth_proxy' ? ($s['required_oauth_provider'] ?? null) : null,
                    'timeout_seconds' => (int) ($s['timeout_seconds'] ?? 30),
                    'is_active' => true,
                    'sort_order' => $i,
                ]);
            }
        });
    }

    /**
     * Persist setting defs (the per-deployment variables the vendor
     * declares for buyers to fill). Full-replace on save — same pattern
     * as persistSkills().
     */
    private function persistSettingDefs(Agent $agent, array $defs): void
    {
        DB::transaction(function () use ($agent, $defs) {
            $agent->settingDefs()->delete();

            foreach ($defs as $i => $d) {
                AgentSettingDef::create([
                    'agent_id' => $agent->id,
                    'key' => strtolower($d['key']),
                    'label' => $d['label'],
                    'type' => $d['type'],
                    'default_value' => $d['default_value'] ?? null,
                    'options' => ($d['type'] === 'select' && ! empty($d['options'])) ? array_values($d['options']) : null,
                    'is_required' => (bool) ($d['is_required'] ?? false),
                    'description' => $d['description'] ?? null,
                    'sort_order' => $i,
                ]);
            }
        });
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
