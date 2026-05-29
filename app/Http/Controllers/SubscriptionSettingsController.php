<?php

namespace App\Http\Controllers;

use App\Models\AgentSettingDef;
use App\Models\OauthApp;
use App\Models\Subscription;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Per-subscription configuration. Two parts:
 *
 * 1. Connections — which third-party services this agent needs (derived
 *    from its skills' required_oauth_provider). The buyer connects each
 *    + picks routing (e.g. the Slack channel). Stored under
 *    settings['routing'][provider].
 *
 * 2. Variables — vendor-declared AgentSettingDef values, substituted as
 *    {{key}} into system_prompt by LlmGateway at run time.
 */
class SubscriptionSettingsController extends Controller
{
    public function show(Request $request, Subscription $subscription): Response
    {
        $this->authorize($request, $subscription);
        $subscription->load(['agent.settingDefs', 'agent.skills', 'knowledgeSources', 'mcpConnections']);
        $user = $request->user();

        $defs = $subscription->agent->settingDefs->map(fn (AgentSettingDef $d) => [
            'id' => $d->id,
            'key' => $d->key,
            'label' => $d->label,
            'type' => $d->type,
            'defaultValue' => $d->default_value,
            'options' => $d->options ?? [],
            'isRequired' => (bool) $d->is_required,
            'description' => $d->description,
        ])->values()->all();

        // Providers this agent's skills need (oauth_proxy transport).
        $providers = $subscription->agent->skills
            ->where('transport', 'oauth_proxy')
            ->pluck('required_oauth_provider')
            ->filter()
            ->unique()
            ->values();

        $apps = OauthApp::query()->whereIn('provider', $providers)->get()->keyBy('provider');

        $connections = $providers->map(function (string $provider) use ($apps, $user) {
            $app = $apps->get($provider);
            $token = $user?->oauthTokenFor($provider);

            return [
                'provider' => $provider,
                'label' => $app?->label ?? ucfirst($provider),
                'icon' => $app?->icon,
                'connected' => (bool) $token,
                'accountLabel' => $token?->account_label,
                'expired' => $token?->isExpired() ?? false,
                // Slack supports an in-app channel picker; other providers
                // just need the connection for now.
                'supportsChannelPicker' => $provider === 'slack',
            ];
        })->values()->all();

        $settings = (array) ($subscription->settings ?? []);

        return Inertia::render('SubscriptionConfigure', [
            'subscription' => [
                'id' => $subscription->id,
                'agentName' => $subscription->agent?->name,
                'agentSlug' => $subscription->agent?->slug,
                'status' => $subscription->status,
            ],
            'defs' => $defs,
            'connections' => $connections,
            'values' => $settings,
            'routing' => $settings['routing'] ?? [],
            'acceptsKnowledge' => (bool) $subscription->agent?->accepts_knowledge,
            // Embeddings require the agent owner to have an OpenAI key.
            'knowledgeReady' => (bool) $subscription->agent?->seller?->llmCredentialFor('openai'),
            'knowledge' => $subscription->knowledgeSources->map(fn ($s) => [
                'id' => $s->id,
                'title' => $s->title,
                'sourceType' => $s->source_type,
                'filename' => $s->original_filename,
                'status' => $s->status,
                'error' => $s->error,
                'chunkCount' => $s->chunk_count,
                'bytes' => $s->bytes,
                'createdAt' => $s->created_at?->format('M d, Y H:i'),
            ])->values()->all(),
            'mcpConnections' => $subscription->mcpConnections->map(fn ($c) => [
                'id' => $c->id,
                'label' => $c->label,
                'url' => $c->url,
                'authType' => $c->auth_type,
                'isActive' => (bool) $c->is_active,
                'status' => $c->status,
                'statusMessage' => $c->status_message,
                'toolCount' => $c->tool_count,
                'tools' => collect($c->tools_cache ?? [])->map(fn ($t) => [
                    'name' => $t['name'] ?? '',
                    'description' => $t['description'] ?? '',
                ])->values()->all(),
                'checkedAt' => $c->checked_at?->format('M d, Y H:i'),
            ])->values()->all(),
            'mcpCatalog' => \App\Models\McpServer::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->get()
                ->map(fn ($s) => [
                    'slug' => $s->slug,
                    'name' => $s->name,
                    'icon' => $s->icon,
                    'category' => $s->category,
                    'summary' => $s->summary,
                    'url' => $s->url,
                    'authType' => $s->auth_type,
                    'setupHint' => $s->setup_hint,
                    'docsUrl' => $s->docs_url,
                ])->values()->all(),
        ]);
    }

    public function update(Request $request, Subscription $subscription): RedirectResponse
    {
        $this->authorize($request, $subscription);
        $subscription->load(['agent.settingDefs']);

        $defs = $subscription->agent->settingDefs;
        $rules = [
            'values' => ['nullable', 'array'],
            // Routing — per-provider channel/target the buyer picked.
            // e.g. routing[slack][channel] = "#sales".
            'routing' => ['nullable', 'array'],
            'routing.*.channel' => ['nullable', 'string', 'max:200'],
        ];

        foreach ($defs as $d) {
            $field = "values.{$d->key}";
            $rule = [$d->is_required ? 'required' : 'nullable'];
            $rule[] = match ($d->type) {
                'number' => 'numeric',
                'boolean' => 'in:0,1,true,false,on,off',
                default => 'string',
            };
            if ($d->type === 'select' && ! empty($d->options)) {
                $rule[] = \Illuminate\Validation\Rule::in($d->options);
            }
            if (in_array($d->type, ['text', 'textarea', 'select', 'slack_channel'], true)) {
                $rule[] = 'max:4000';
            }
            $rules[$field] = $rule;
        }

        $validated = $request->validate($rules);
        $raw = $validated['values'] ?? [];

        $clean = [];
        foreach ($defs as $d) {
            if (! array_key_exists($d->key, $raw)) {
                continue;
            }
            $clean[$d->key] = $d->coerce($raw[$d->key]);
        }

        // Preserve / overwrite routing. Drop empty channel values so we
        // don't store {slack: {channel: ''}}.
        $routing = collect($validated['routing'] ?? [])
            ->map(fn ($cfg) => array_filter($cfg, fn ($v) => $v !== null && $v !== ''))
            ->filter(fn ($cfg) => ! empty($cfg))
            ->all();
        if (! empty($routing)) {
            $clean['routing'] = $routing;
        }

        $subscription->forceFill(['settings' => $clean])->save();
        audit('subscription.configure', $subscription, [
            'agent' => $subscription->agent?->slug,
            'keys' => array_keys($clean),
            'routing' => array_keys($routing),
        ]);

        return redirect()
            ->route('console')
            ->with('status', "Configuration saved for {$subscription->agent?->name}.");
    }

    private function authorize(Request $request, Subscription $subscription): void
    {
        $user = $request->user();
        abort_unless($user && $subscription->buyer_id === $user->id, 403);
    }
}
