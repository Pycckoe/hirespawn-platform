<?php

namespace App\Services\Agents;

use App\Models\Agent;
use App\Models\BuyerProfile;
use App\Models\Subscription;
use App\Models\UsageEvent;
use App\Services\Llm\LlmResponse;
use App\Support\Rates;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Persists an agent run as a UsageEvent and debits the buyer's Power on
 * success. Single source of truth for run billing so every entry point
 * (in-app chat, Slack mentions, …) records runs the same way.
 */
class RunRecorder
{
    public function record(Subscription $subscription, Agent $agent, BuyerProfile $profile, int $cost, string $input, LlmResponse $response, string $source = 'chat'): UsageEvent
    {
        $requestId = 'run_'.Str::random(12);

        // Tarif built-in connector calls (GitHub/Slack tools etc.) per call,
        // on top of the agent's flat per-run cost. Admin-configurable via
        // connector_call_power_cost site setting (default 1⚡).
        $perCall = (int) \App\Models\SiteSetting::lookup('connector_call_power_cost', '1');
        $connectorCalls = collect($response->toolCallLog ?? [])->filter(fn ($c) => ! empty($c['connector_call']))->count();
        $connectorPower = $connectorCalls * max(0, $perCall);
        $cost += $connectorPower;
        $costCents = (int) round($cost * Rates::eurCentsPerPower());

        if (! $response->ok) {
            return UsageEvent::create([
                'subscription_id' => $subscription->id,
                'event_type' => 'run',
                'units_consumed' => 0,
                'unit_type' => $agent->per_unit,
                'power_consumed' => 0,
                'request_id' => $requestId,
                'agent_response_status' => 502,
                'latency_ms' => $response->latencyMs,
                'cost_cents' => 0,
                'input_tokens' => $response->inputTokens,
                'output_tokens' => $response->outputTokens,
                'provider_cost_cents' => $response->providerCostCents,
                'recorded_at' => now(),
                'metadata' => [
                    'input' => $input,
                    'input_preview' => Str::limit($input, 200),
                    'error' => $response->errorMessage,
                    'agent_slug' => $agent->slug,
                    'source' => $source,
                    'tool_calls' => $response->toolCallLog,
                ],
            ]);
        }

        return DB::transaction(function () use ($profile, $subscription, $agent, $cost, $costCents, $input, $response, $requestId, $source) {
            $profile->decrement('power_balance', $cost);

            return UsageEvent::create([
                'subscription_id' => $subscription->id,
                'event_type' => 'run',
                'units_consumed' => 1,
                'unit_type' => $agent->per_unit,
                'power_consumed' => $cost,
                'request_id' => $requestId,
                'agent_response_status' => 200,
                'latency_ms' => $response->latencyMs,
                'cost_cents' => $costCents,
                'input_tokens' => $response->inputTokens,
                'output_tokens' => $response->outputTokens,
                'provider_cost_cents' => $response->providerCostCents,
                'recorded_at' => now(),
                'metadata' => [
                    'input' => $input,
                    'output' => $response->text,
                    'input_preview' => Str::limit($input, 200),
                    'output_preview' => Str::limit($response->text, 200),
                    'agent_slug' => $agent->slug,
                    'model' => $agent->llmModel?->slug,
                    'source' => $source,
                    'tool_calls' => $response->toolCallLog,
                    'connector_calls' => $connectorCalls,
                    'connector_power' => $connectorPower,
                ],
            ]);
        });
    }
}
