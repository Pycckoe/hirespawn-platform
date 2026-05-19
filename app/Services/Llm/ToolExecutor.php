<?php

namespace App\Services\Llm;

use App\Models\AgentSkill;
use App\Models\Subscription;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Dispatches a tool call coming back from an LLM to the right transport.
 *
 * Current transports:
 * - `webhook`  → signed POST to the vendor's URL with payload + HMAC.
 * - `builtin`  → server-side handler we control (v3+, none shipped yet).
 * - `oauth_proxy` → call the third-party provider on behalf of the
 *                   client (v2 — added in the next commit).
 *
 * Every call returns a JSON-serialisable result that the LLM gets back
 * as a `tool_result` message. Errors are surfaced as `{error: "..."}`
 * so the model can apologise / retry instead of breaking the chain.
 */
class ToolExecutor
{
    /**
     * @param array<string, mixed> $arguments LLM-supplied tool arguments
     * @return array{success: bool, output: mixed, error?: string, latency_ms: int}
     */
    public function execute(AgentSkill $skill, array $arguments, Subscription $subscription): array
    {
        $startedAt = microtime(true);
        try {
            $result = match ($skill->transport) {
                'webhook' => $this->executeWebhook($skill, $arguments, $subscription),
                'builtin' => $this->executeBuiltin($skill, $arguments, $subscription),
                'oauth_proxy' => ['error' => 'oauth_proxy transport ships in v2'],
                default => ['error' => "Unknown transport: {$skill->transport}"],
            };

            $latencyMs = (int) round((microtime(true) - $startedAt) * 1000);
            $isError = isset($result['error']);

            return [
                'success' => ! $isError,
                'output' => $result,
                'error' => $result['error'] ?? null,
                'latency_ms' => $latencyMs,
            ];
        } catch (Throwable $e) {
            $latencyMs = (int) round((microtime(true) - $startedAt) * 1000);
            Log::error('ToolExecutor failed', [
                'skill_id' => $skill->id,
                'transport' => $skill->transport,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'output' => null,
                'error' => $e->getMessage(),
                'latency_ms' => $latencyMs,
            ];
        }
    }

    private function executeWebhook(AgentSkill $skill, array $arguments, Subscription $subscription): array
    {
        if (! $skill->webhook_url) {
            return ['error' => "Skill '{$skill->name}' has no webhook_url configured."];
        }

        $payload = [
            'tool' => $skill->name,
            'arguments' => $arguments,
            'subscription_id' => $subscription->id,
            'agent_slug' => $skill->agent?->slug,
            'buyer_id' => $subscription->buyer_id,
            'timestamp' => now()->toIso8601String(),
            'nonce' => bin2hex(random_bytes(8)),
        ];
        $body = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        $secret = $skill->agent?->webhook_secret ?: '';
        $signature = $secret ? hash_hmac('sha256', $body, $secret) : '';

        $resp = Http::withHeaders([
            'Content-Type' => 'application/json',
            'User-Agent' => 'Hirespawn-ToolExecutor/1.0',
            'X-Hirespawn-Signature' => "sha256={$signature}",
            'X-Hirespawn-Tool' => $skill->name,
        ])
            ->timeout($skill->timeout_seconds ?: 30)
            ->withBody($body, 'application/json')
            ->post($skill->webhook_url);

        if (! $resp->ok()) {
            return ['error' => "Vendor webhook returned HTTP {$resp->status()}", 'body' => $resp->body()];
        }

        // Vendor SHOULD respond with JSON. If they don't we wrap the
        // raw body so the LLM still sees something usable.
        $decoded = $resp->json();

        return $decoded !== null ? (array) $decoded : ['output' => $resp->body()];
    }

    private function executeBuiltin(AgentSkill $skill, array $arguments, Subscription $subscription): array
    {
        // Placeholder — we'll register handlers (email, slack-via-proxy,
        // etc.) here in subsequent commits. Returning an error keeps the
        // chain alive without faking results.
        return ['error' => "Built-in handler '{$skill->builtin_handler}' is not yet implemented."];
    }
}
