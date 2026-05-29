<?php

namespace App\Http\Controllers;

use App\Models\Agent;
use App\Models\Subscription;
use App\Models\UsageEvent;
use App\Services\Llm\LlmGateway;
use App\Support\Rates;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class InvokeController extends Controller
{
    /**
     * Run a single task on an agent. Requires the buyer to have an
     * active subscription, enough Power, and the agent must be wired
     * to an LLM model with a valid seller credential. The agent's
     * system_prompt is sent first, then the buyer's input as the user
     * message. Real provider tokens + cost are recorded on the
     * UsageEvent so the dashboards reflect actual ⚡ + € flow.
     *
     * Responds with JSON (the chat panel posts via axios and appends the
     * turn in place, no page reload) or an Inertia redirect for a plain
     * form post.
     */
    public function store(Request $request, Agent $agent, LlmGateway $gateway): RedirectResponse|JsonResponse
    {
        $validated = $request->validate([
            'input' => ['required', 'string', 'max:8000'],
        ]);

        $user = $request->user();

        $subscription = Subscription::query()
            ->where('buyer_id', $user->id)
            ->where('agent_id', $agent->id)
            ->whereIn('status', ['active', 'paused'])
            ->first();

        if (! $subscription) {
            return $this->fail($request, "You need to deploy {$agent->name} before running a task.");
        }

        $profile = $user->buyerProfile()->firstOrCreate([], []);
        $cost = (int) $agent->power_cost;

        if ($profile->power_balance < $cost) {
            return $this->fail($request, "Not enough Power. {$cost}⚡ required, you have {$profile->power_balance}⚡. Top up to run.");
        }

        // Refuse early if the agent isn't fully wired — the LlmGateway
        // would error the same way but this gives a clearer message and
        // avoids charging the buyer Power for a guaranteed failure.
        if (! $agent->llm_model_id) {
            return $this->fail($request, "{$agent->name} is not yet wired to an LLM model. The seller must finish setup.");
        }

        // Pass the subscription so the gateway can route tool calls
        // through the buyer's stored credentials (v2) and so the audit
        // log on UsageEvent.metadata knows who triggered what.
        $response = $gateway->run(
            $agent->fresh(['llmModel', 'seller', 'skills', 'settingDefs']),
            $validated['input'],
            $subscription,
        );
        $requestId = 'run_'.Str::random(12);
        // Buyer pays the Power cost the seller set. Convert to € cents at
        // the admin-managed Power → EUR rate so usage_events.cost_cents
        // matches what the seller is owed.
        $costCents = (int) round($cost * Rates::eurCentsPerPower());

        if (! $response->ok) {
            // Provider failure: log the event for billing transparency
            // but DO NOT charge the buyer Power (no successful run).
            $event = UsageEvent::create([
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
                    'input' => $validated['input'],
                    'input_preview' => Str::limit($validated['input'], 200),
                    'error' => $response->errorMessage,
                    'agent_slug' => $agent->slug,
                    'tool_calls' => $response->toolCallLog,
                ],
            ]);

            if ($request->wantsJson()) {
                return response()->json([
                    'turn' => $this->turn($event, $response, $validated['input'], false),
                    'powerBalance' => (int) $profile->power_balance,
                ]);
            }

            return back()->with('status', "✗ {$agent->name} failed: {$response->errorMessage}");
        }

        $event = DB::transaction(function () use ($profile, $subscription, $agent, $cost, $response, $requestId, $costCents, $validated) {
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
                    // Full input + output so the chat UI on /agent/{slug}
                    // can render real turns; preview kept for the
                    // condensed Live Ops feed on /console.
                    'input' => $validated['input'],
                    'output' => $response->text,
                    'input_preview' => Str::limit($validated['input'], 200),
                    'output_preview' => Str::limit($response->text, 200),
                    'agent_slug' => $agent->slug,
                    'model' => $agent->llmModel?->slug,
                    'tool_calls' => $response->toolCallLog,
                ],
            ]);
        });

        if ($request->wantsJson()) {
            return response()->json([
                'turn' => $this->turn($event, $response, $validated['input'], true),
                'powerBalance' => (int) $profile->fresh()->power_balance,
            ]);
        }

        return back()->with('status', "✓ {$agent->name} ran your task. Burned {$cost}⚡ ({$response->inputTokens}+{$response->outputTokens} tok, {$response->latencyMs}ms).");
    }

    /**
     * Shape a UsageEvent + response into the turn the chat panel renders
     * (mirrors AgentController@show's recentRuns mapping).
     */
    private function turn(UsageEvent $event, $response, string $input, bool $ok): array
    {
        return [
            'id' => $event->id,
            'input' => $input,
            'output' => $ok ? $response->text : '',
            'error' => $ok ? null : $response->errorMessage,
            'ok' => $ok,
            'cost' => (int) $event->power_consumed,
            'inputTokens' => (int) $response->inputTokens,
            'outputTokens' => (int) $response->outputTokens,
            'latencyMs' => (int) $response->latencyMs,
            'toolCalls' => $response->toolCallLog,
            'at' => 'just now',
        ];
    }

    /**
     * Pre-flight failure (no sub / no power / not wired). JSON for the chat
     * panel, redirect-back for a plain form post.
     */
    private function fail(Request $request, string $message): RedirectResponse|JsonResponse
    {
        if ($request->wantsJson()) {
            return response()->json(['message' => $message], 422);
        }

        return back()->with('status', $message);
    }

    /**
     * Streaming variant for the chat "typing" effect. Returns an SSE stream
     * that emits {type:delta,text} as the model produces tokens, then a
     * {type:done,turn,powerBalance} frame after the run is recorded. Agents
     * WITH tools (skills or MCP) can't stream token-by-token, so they run
     * normally and the full answer is emitted as one delta. Pre-flight
     * failures return a JSON 422 (before the stream starts) so the frontend
     * can fall back to the non-stream endpoint.
     */
    public function stream(Request $request, Agent $agent, LlmGateway $gateway): StreamedResponse|JsonResponse
    {
        $validated = $request->validate(['input' => ['required', 'string', 'max:8000']]);
        $user = $request->user();

        $subscription = Subscription::query()
            ->where('buyer_id', $user->id)
            ->where('agent_id', $agent->id)
            ->whereIn('status', ['active', 'paused'])
            ->first();
        if (! $subscription) {
            return response()->json(['message' => "You need to deploy {$agent->name} before running a task."], 422);
        }

        $profile = $user->buyerProfile()->firstOrCreate([], []);
        $cost = (int) $agent->power_cost;
        if ($profile->power_balance < $cost) {
            return response()->json(['message' => "Not enough Power. {$cost}⚡ required, you have {$profile->power_balance}⚡."], 422);
        }
        if (! $agent->llm_model_id) {
            return response()->json(['message' => "{$agent->name} is not yet wired to an LLM model."], 422);
        }

        $input = $validated['input'];
        $costCents = (int) round($cost * Rates::eurCentsPerPower());
        // Tools (vendor skills or buyer MCP) need the full multi-turn loop —
        // can't stream those token-by-token.
        $hasTools = $agent->skills()->exists()
            || $subscription->mcpConnections()->where('is_active', true)->exists();

        return response()->stream(function () use ($gateway, $agent, $subscription, $profile, $cost, $costCents, $input, $hasTools) {
            $emit = function (array $data) {
                echo 'data: '.json_encode($data)."\n\n";
                if (ob_get_level() > 0) {
                    @ob_flush();
                }
                flush();
            };

            try {
                $fresh = $agent->fresh(['llmModel', 'seller', 'skills', 'settingDefs']);

                if ($hasTools) {
                    $response = $gateway->run($fresh, $input, $subscription);
                    if ($response->ok && $response->text !== '') {
                        $emit(['type' => 'delta', 'text' => $response->text]);
                    }
                } else {
                    $response = $gateway->runStream($fresh, $input, $subscription, function (string $delta) use ($emit) {
                        $emit(['type' => 'delta', 'text' => $delta]);
                    });
                }

                $event = $this->recordRun($subscription, $agent, $profile, $cost, $costCents, $input, $response);

                if (! $response->ok) {
                    $emit(['type' => 'error', 'message' => $response->errorMessage ?: 'Run failed.', 'turn' => $this->turn($event, $response, $input, false)]);
                } else {
                    $emit(['type' => 'done', 'turn' => $this->turn($event, $response, $input, true), 'powerBalance' => (int) $profile->fresh()->power_balance]);
                }
            } catch (\Throwable $e) {
                $emit(['type' => 'error', 'message' => 'Run failed: '.$e->getMessage()]);
            }
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'X-Accel-Buffering' => 'no', // ask nginx not to buffer the stream
        ]);
    }

    /**
     * Persist a run as a UsageEvent and debit Power on success. Mirrors the
     * billing logic in store() so the stream + non-stream paths agree.
     */
    private function recordRun(Subscription $subscription, Agent $agent, $profile, int $cost, int $costCents, string $input, $response): UsageEvent
    {
        $requestId = 'run_'.Str::random(12);

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
                    'tool_calls' => $response->toolCallLog,
                ],
            ]);
        }

        return DB::transaction(function () use ($profile, $subscription, $agent, $cost, $response, $requestId, $costCents, $input) {
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
                    'tool_calls' => $response->toolCallLog,
                ],
            ]);
        });
    }
}
