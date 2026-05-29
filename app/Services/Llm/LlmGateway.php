<?php

namespace App\Services\Llm;

use App\Models\Agent;
use App\Models\LlmModel;
use App\Models\Subscription;
use App\Models\User;
use App\Services\Llm\Contracts\LlmDriver;
use App\Services\Llm\Drivers\AnthropicDriver;
use App\Services\Llm\Drivers\OpenAiDriver;
use App\Support\Rates;

/**
 * Routes an agent invocation to the right provider-specific driver and
 * manages the multi-turn tool-use loop.
 *
 * One run() call may invoke the model 1..N times: every time the LLM
 * returns tool_calls we execute them via ToolExecutor, push results
 * into the conversation, and call the model again — until it returns a
 * plain text answer (or we hit the admin-configured iteration ceiling).
 */
class LlmGateway
{
    public function __construct(
        private readonly ToolExecutor $executor,
        private readonly \App\Services\Knowledge\KnowledgeRetriever $retriever,
        private readonly \App\Services\Mcp\McpToolset $mcpToolset,
        private readonly \App\Services\Mcp\McpClient $mcpClient,
    ) {
    }

    /**
     * Run the agent against the seller's chosen LLM, executing any tool
     * calls the model makes along the way. The returned LlmResponse has
     * aggregated token totals + a `toolCallLog` so the caller can write
     * an audit-friendly UsageEvent.
     */
    public function run(Agent $agent, string $userPrompt, ?Subscription $subscription = null): LlmResponse
    {
        $model = $agent->llmModel;
        if (! $model) {
            return LlmResponse::error("Agent '{$agent->slug}' has no LLM model assigned.");
        }
        if (! $model->is_active) {
            return LlmResponse::error("Model {$model->name} is no longer active. Seller must pick another model.");
        }

        /** @var User|null $seller */
        $seller = $agent->seller;
        $credential = $seller?->llmCredentialFor($model->provider);
        if (! $credential) {
            return LlmResponse::error("Seller has no API key configured for {$model->provider}.");
        }

        $fallbackMaxOutput = Rates::llmDefaultMaxOutputTokens();
        $maxOutput = $agent->max_output_tokens
            ?: ($agent->est_output_tokens > 0 ? $agent->est_output_tokens * 2 : $model->max_output_tokens)
            ?: $fallbackMaxOutput;
        $maxOutput = min($maxOutput, $model->max_output_tokens ?: $maxOutput);
        $maxIterations = Rates::llmMaxIterations();

        $driver = $this->driverFor($model->provider);
        $apiKey = $credential->decryptedKey();

        $skills = $agent->skills;
        $tools = $this->toolsFor($model->provider, $skills);
        $skillsByName = $skills->keyBy('name');

        // Merge in tools from the buyer's connected MCP servers (if any).
        // Best-effort: a broken MCP server contributes nothing and never
        // breaks the run. mcpDispatch maps a namespaced tool name back to
        // its connection + original tool name for execution below.
        $mcpDispatch = [];
        if ($subscription) {
            $mcp = $this->mcpToolset->build($subscription, $model->provider);
            $tools = array_merge($tools, $mcp['tools']);
            $mcpDispatch = $mcp['dispatch'];
        }

        // Substitute {{key}} placeholders in system_prompt with values
        // the buyer picked at /console/subscriptions/{sub}/configure.
        // Unfilled / unknown keys keep their literal {{...}} so the LLM
        // can flag the gap instead of silently dropping context.
        $systemPrompt = $this->renderSystemPrompt($agent, $subscription);

        // RAG: if the vendor enabled a knowledge base for this agent, pull
        // the chunks most relevant to the user's prompt and append them so
        // the model can ground its answer in the buyer's own docs.
        // RAG: append the knowledge chunks most relevant to the prompt.
        // Available to any deployment the buyer has added knowledge to — the
        // exists() check keeps us from spending an embedding call on agents
        // with no knowledge. The vendor's accepts_knowledge flag only tunes
        // the instructions (see appendKnowledge), it no longer gates this.
        if ($subscription && $subscription->knowledgeChunks()->exists()) {
            $systemPrompt = $this->appendKnowledge($systemPrompt, $agent, $subscription, $userPrompt);
        }

        $messages = [['role' => 'user', 'content' => $userPrompt]];

        $totalIn = 0;
        $totalOut = 0;
        $totalCost = 0;
        $totalLatency = 0;
        $toolCallLog = [];
        $finalText = '';

        for ($iter = 0; $iter < $maxIterations; $iter++) {
            $request = new LlmRequest(
                model: $model,
                apiKey: $apiKey,
                systemPrompt: $systemPrompt,
                messages: $messages,
                maxOutputTokens: $maxOutput,
                tools: $tools,
            );

            $resp = $driver->complete($request);

            $totalIn += $resp->inputTokens;
            $totalOut += $resp->outputTokens;
            $totalCost += $resp->providerCostCents;
            $totalLatency += $resp->latencyMs;

            if (! $resp->ok) {
                return new LlmResponse(
                    text: '',
                    inputTokens: $totalIn,
                    outputTokens: $totalOut,
                    providerCostCents: $totalCost,
                    latencyMs: $totalLatency,
                    ok: false,
                    errorMessage: $resp->errorMessage,
                    toolCallLog: $toolCallLog,
                );
            }

            // Final answer — no more tools requested.
            if (empty($resp->toolCalls)) {
                $finalText = $resp->text;

                if ($credential) {
                    $credential->forceFill(['last_used_at' => now()])->save();
                }

                return new LlmResponse(
                    text: $finalText,
                    inputTokens: $totalIn,
                    outputTokens: $totalOut,
                    providerCostCents: $totalCost,
                    latencyMs: $totalLatency,
                    ok: true,
                    toolCallLog: $toolCallLog,
                );
            }

            // Tools requested — push assistant msg + execute each, then loop.
            if ($resp->assistantMessage) {
                $messages[] = $resp->assistantMessage;
            }

            foreach ($resp->toolCalls as $call) {
                // MCP tool? Route to the buyer's connected server.
                if (isset($mcpDispatch[$call['name']])) {
                    $target = $mcpDispatch[$call['name']];
                    $mcpResult = $this->mcpClient->callTool($target['connection'], $target['tool'], $call['arguments']);
                    $messages[] = [
                        'role' => 'tool_result',
                        'tool_use_id' => $call['id'],
                        'content' => json_encode($mcpResult['ok'] ? $mcpResult['content'] : ['error' => $mcpResult['error'] ?? 'MCP tool failed']),
                        'is_error' => ! $mcpResult['ok'],
                    ];
                    $toolCallLog[] = [
                        'name' => $call['name'],
                        'arguments' => $call['arguments'],
                        'result' => $mcpResult['ok'] ? ['mcp' => $target['tool']] : ['error' => $mcpResult['error'] ?? 'mcp_failed'],
                        'success' => $mcpResult['ok'],
                        'iteration' => $iter,
                    ];
                    continue;
                }

                $skill = $skillsByName->get($call['name']);
                if (! $skill || ! $subscription) {
                    $messages[] = [
                        'role' => 'tool_result',
                        'tool_use_id' => $call['id'],
                        'content' => json_encode(['error' => $skill ? 'No subscription context for tool execution' : "Unknown tool: {$call['name']}"]),
                        'is_error' => true,
                    ];
                    $toolCallLog[] = [
                        'name' => $call['name'],
                        'arguments' => $call['arguments'],
                        'result' => ['error' => 'unknown_or_no_subscription'],
                        'iteration' => $iter,
                    ];
                    continue;
                }

                $execution = $this->executor->execute($skill, $call['arguments'], $subscription);
                $messages[] = [
                    'role' => 'tool_result',
                    'tool_use_id' => $call['id'],
                    'content' => json_encode($execution['output']),
                    'is_error' => ! $execution['success'],
                ];
                $toolCallLog[] = [
                    'name' => $call['name'],
                    'arguments' => $call['arguments'],
                    'result' => $execution['output'],
                    'success' => $execution['success'],
                    'error' => $execution['error'] ?? null,
                    'latency_ms' => $execution['latency_ms'],
                    'iteration' => $iter,
                ];
            }
        }

        // Loop budget exhausted — return whatever text we accumulated.
        return new LlmResponse(
            text: $finalText ?: '(tool-use loop exceeded max iterations)',
            inputTokens: $totalIn,
            outputTokens: $totalOut,
            providerCostCents: $totalCost,
            latencyMs: $totalLatency,
            ok: false,
            errorMessage: 'Exceeded max tool-use iterations.',
            toolCallLog: $toolCallLog,
        );
    }

    /**
     * Same as run() but for the publish-form preview — one-shot, no
     * subscription context, no tools. Lets the seller verify their key
     * before listing the agent.
     */
    public function preview(LlmModel $model, string $apiKey, ?string $systemPrompt, string $userPrompt, int $maxOutputTokens = 256): LlmResponse
    {
        $request = new LlmRequest(
            model: $model,
            apiKey: $apiKey,
            systemPrompt: $systemPrompt,
            messages: [['role' => 'user', 'content' => $userPrompt]],
            maxOutputTokens: $maxOutputTokens,
            tools: [],
        );

        return $this->driverFor($model->provider)->complete($request);
    }

    /**
     * Build the provider-specific tool catalogue from an agent's skills.
     */
    /**
     * Resolve {{key}} placeholders in the agent's system_prompt using
     * the buyer's subscription.settings, falling back to each setting
     * def's default_value. Keys with no value anywhere are left as
     * literal {{key}} so the model can ask the buyer to configure.
     */
    private function renderSystemPrompt(\App\Models\Agent $agent, ?\App\Models\Subscription $subscription): ?string
    {
        $prompt = $agent->system_prompt;
        if (! $prompt) {
            return null;
        }

        $defs = $agent->settingDefs ?? collect();
        if ($defs->isEmpty() || ! str_contains($prompt, '{{')) {
            return $prompt;
        }

        $values = (array) ($subscription?->settings ?? []);
        $defaults = $defs->mapWithKeys(fn ($d) => [$d->key => $d->default_value])->all();

        return preg_replace_callback(
            '/\{\{\s*([a-z][a-z0-9_]*)\s*\}\}/i',
            function ($m) use ($values, $defaults) {
                $key = $m[1];
                if (array_key_exists($key, $values) && $values[$key] !== null && $values[$key] !== '') {
                    return is_scalar($values[$key]) ? (string) $values[$key] : json_encode($values[$key]);
                }
                if (array_key_exists($key, $defaults) && $defaults[$key] !== null && $defaults[$key] !== '') {
                    return (string) $defaults[$key];
                }

                return $m[0]; // keep literal so the gap is visible
            },
            $prompt
        );
    }

    /**
     * Retrieve the knowledge chunks most relevant to the prompt and append
     * them (plus the vendor's usage instructions) to the system prompt.
     * No-op when nothing is indexed or embeddings are unavailable.
     */
    private function appendKnowledge(?string $systemPrompt, \App\Models\Agent $agent, \App\Models\Subscription $subscription, string $userPrompt): ?string
    {
        $topK = (int) \App\Models\SiteSetting::lookup('knowledge_top_k', '5');
        $snippets = $this->retriever->retrieve($subscription, $userPrompt, $topK > 0 ? $topK : 5);
        if ($snippets === []) {
            return $systemPrompt;
        }

        $block = "\n\n# Knowledge base\n";
        $instructions = trim((string) $agent->knowledge_instructions);
        $block .= ($instructions !== '' ? $instructions : 'Use the following project knowledge to answer. If the answer is not contained here, say so rather than guessing.')."\n\n";
        foreach ($snippets as $i => $snippet) {
            $block .= '['.($i + 1).'] '.trim($snippet['content'])."\n\n";
        }

        return ($systemPrompt ?? '').$block;
    }

    private function toolsFor(string $provider, $skills): array
    {
        return $skills
            ->map(fn ($s) => match ($provider) {
                'anthropic' => $s->toAnthropicTool(),
                'openai', 'google' => $s->toOpenAiTool(),
                default => null,
            })
            ->filter()
            ->values()
            ->all();
    }

    private function driverFor(string $provider): LlmDriver
    {
        return match ($provider) {
            'anthropic' => new AnthropicDriver(),
            'openai' => new OpenAiDriver(),
            'google' => new \App\Services\Llm\Drivers\GoogleDriver(),
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
