<?php

namespace App\Http\Controllers;

use App\Models\LlmModel;
use App\Models\SellerLlmCredential;
use App\Services\Llm\LlmGateway;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class VendorCredentialsController extends Controller
{
    /**
     * Store or replace the seller's API key for a provider. One row per
     * (seller, provider) — adding a key with the same provider twice
     * just updates the existing row.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user, 401);

        $providers = LlmModel::query()->distinct()->pluck('provider')->all();

        $validated = $request->validate([
            'provider' => ['required', 'string', Rule::in($providers)],
            'api_key' => ['required', 'string', 'min:10', 'max:400'],
            'label' => ['nullable', 'string', 'max:80'],
        ]);

        $credential = SellerLlmCredential::firstOrNew([
            'seller_id' => $user->id,
            'provider' => $validated['provider'],
        ]);

        $credential->label = $validated['label'] ?? ucfirst($validated['provider']).' production';
        $credential->setKey($validated['api_key']);
        $credential->verified_at = null;
        $credential->save();

        audit('llm_credential.save', $credential, [
            'provider' => $credential->provider,
            'last4' => $credential->last4,
        ]);

        return back()->with('status', "Saved {$validated['provider']} key (••••{$credential->last4}).");
    }

    /**
     * Drop the seller's key for a provider. Existing agents that depend
     * on it will fail at invocation time until a new key is added.
     */
    public function destroy(Request $request, SellerLlmCredential $credential): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user && $credential->seller_id === $user->id, 403);

        $provider = $credential->provider;
        $credential->delete();

        audit('llm_credential.delete', null, ['provider' => $provider]);

        return back()->with('status', "Removed {$provider} key.");
    }

    /**
     * Live key-check: fires a 1-token preview against the cheapest model
     * for the chosen provider. On success the key is marked verified.
     */
    public function verify(Request $request, SellerLlmCredential $credential, LlmGateway $gateway): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user && $credential->seller_id === $user->id, 403);

        $cheapest = LlmModel::query()
            ->where('provider', $credential->provider)
            ->where('is_active', true)
            ->orderBy('input_price_cents_per_1m')
            ->first();

        if (! $cheapest) {
            return back()->withErrors(['credential' => "No active models for provider '{$credential->provider}'."]);
        }

        $resp = $gateway->preview(
            model: $cheapest,
            apiKey: $credential->decryptedKey(),
            systemPrompt: 'Reply with the single word: ok',
            userPrompt: 'ping',
            maxOutputTokens: 8,
        );

        if (! $resp->ok) {
            return back()->withErrors(['credential' => $resp->errorMessage ?: 'Verification failed.']);
        }

        $credential->forceFill(['verified_at' => now()])->save();

        return back()->with('status', "Key verified against {$cheapest->name} ({$resp->latencyMs}ms).");
    }
}
