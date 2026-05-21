<?php

namespace App\Http\Controllers;

use App\Models\AgentSettingDef;
use App\Models\Subscription;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Per-subscription configuration. Each agent the vendor publishes can
 * declare variables (AgentSettingDef rows); the buyer picks values on
 * /console/subscriptions/{sub}/configure and they're persisted to
 * subscriptions.settings as a flat key→value map. LlmGateway then
 * substitutes {{key}} → value into system_prompt at invocation time.
 */
class SubscriptionSettingsController extends Controller
{
    public function show(Request $request, Subscription $subscription): Response
    {
        $this->authorize($request, $subscription);
        $subscription->load(['agent.settingDefs']);

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

        return Inertia::render('SubscriptionConfigure', [
            'subscription' => [
                'id' => $subscription->id,
                'agentName' => $subscription->agent?->name,
                'agentSlug' => $subscription->agent?->slug,
                'status' => $subscription->status,
            ],
            'defs' => $defs,
            'values' => (array) ($subscription->settings ?? []),
        ]);
    }

    public function update(Request $request, Subscription $subscription): RedirectResponse
    {
        $this->authorize($request, $subscription);
        $subscription->load(['agent.settingDefs']);

        $defs = $subscription->agent->settingDefs;
        $rules = ['values' => ['nullable', 'array']];

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
            if (in_array($d->type, ['text', 'textarea', 'select'], true)) {
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

        $subscription->forceFill(['settings' => $clean])->save();

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
