<?php

namespace App\Services\Llm;

use App\Models\Agent;
use App\Models\LlmModel;
use App\Models\User;
use App\Services\Llm\Contracts\LlmDriver;
use App\Services\Llm\Drivers\AnthropicDriver;
use App\Services\Llm\Drivers\OpenAiDriver;
use RuntimeException;

/**
 * Routes an agent invocation to the right provider-specific driver.
 *
 * Resolves the API key from the seller's credentials, the model from
 * the agent's llm_model_id, then delegates to the driver. Drivers all
 * return a normalised LlmResponse so callers don't branch on provider.
 */
class LlmGateway
{
    /**
     * Run the agent against the seller's chosen LLM. Throws if the agent
     * isn't wired to a model yet or the seller hasn't stored a key for
     * that provider.
     */
    public function run(Agent $agent, string $userPrompt): LlmResponse
    {
        $model = $agent->llmModel;
        if (! $model) {
            throw new RuntimeException("Agent '{$agent->slug}' has no LLM model assigned.");
        }
        if (! $model->is_active) {
            return LlmResponse::error("Model {$model->name} is no longer active. Seller must pick another model.");
        }

        /** @var User $seller */
        $seller = $agent->seller;
        $credential = $seller?->llmCredentialFor($model->provider);
        if (! $credential) {
            return LlmResponse::error("Seller has no API key configured for {$model->provider}.");
        }

        $maxOutput = $agent->max_output_tokens
            ?: ($agent->est_output_tokens > 0 ? $agent->est_output_tokens * 2 : $model->max_output_tokens)
            ?: 4096;

        $request = new LlmRequest(
            model: $model,
            apiKey: $credential->decryptedKey(),
            systemPrompt: $agent->system_prompt,
            userPrompt: $userPrompt,
            maxOutputTokens: min($maxOutput, $model->max_output_tokens ?: $maxOutput),
        );

        $response = $this->driverFor($model->provider)->complete($request);

        // Bookkeeping: stamp last-used so the seller can see the key is live.
        if ($response->ok) {
            $credential->forceFill(['last_used_at' => now()])->save();
        }

        return $response;
    }

    /**
     * Same as run() but for the publish-form preview — runs against the
     * seller's chosen model with a tiny budget so they can sanity-check
     * the agent before listing it.
     */
    public function preview(LlmModel $model, string $apiKey, ?string $systemPrompt, string $userPrompt, int $maxOutputTokens = 256): LlmResponse
    {
        $request = new LlmRequest(
            model: $model,
            apiKey: $apiKey,
            systemPrompt: $systemPrompt,
            userPrompt: $userPrompt,
            maxOutputTokens: $maxOutputTokens,
        );

        return $this->driverFor($model->provider)->complete($request);
    }

    private function driverFor(string $provider): LlmDriver
    {
        return match ($provider) {
            'anthropic' => new AnthropicDriver(),
            'openai' => new OpenAiDriver(),
            // Other providers (google, deepseek, xai, mistral, meta) will
            // get drivers in subsequent iterations. Until then they show
            // up in the catalog so sellers see prices, but invocation
            // returns a clean error.
            default => new class implements LlmDriver
            {
                public function complete(LlmRequest $request): LlmResponse
                {
                    return LlmResponse::error("Provider '{$request->model->provider}' is in the catalog but the runtime adapter is still in development. Pick an Anthropic or OpenAI model for now.");
                }
            },
        };
    }
}
