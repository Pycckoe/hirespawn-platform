<?php

namespace App\Services\Llm\Drivers;

use App\Models\AgentSkill;
use App\Services\Llm\Contracts\LlmDriver;
use App\Services\Llm\LlmRequest;
use App\Services\Llm\LlmResponse;
use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * Anthropic Messages API driver. Handles:
 * - Multi-turn conversations (full history passed each call)
 * - Native tool-use (Anthropic returns `tool_use` content blocks; we
 *   surface them as LlmResponse::$toolCalls for the gateway to dispatch)
 *
 * Spec: https://docs.anthropic.com/en/docs/build-with-claude/tool-use
 */
class AnthropicDriver implements LlmDriver
{
    private const ENDPOINT = 'https://api.anthropic.com/v1/messages';

    private const VERSION = '2023-06-01';

    public function complete(LlmRequest $request): LlmResponse
    {
        $startedAt = microtime(true);

        $payload = [
            'model' => $request->model->api_id,
            'max_tokens' => $request->maxOutputTokens,
            'messages' => $this->mapMessages($request->messages),
        ];
        if ($request->systemPrompt) {
            $payload['system'] = $request->systemPrompt;
        }
        if (! empty($request->tools)) {
            $payload['tools'] = $request->tools;
        }

        try {
            $resp = Http::withHeaders([
                'x-api-key' => $request->apiKey,
                'anthropic-version' => self::VERSION,
                'content-type' => 'application/json',
            ])
                ->timeout(120)
                ->post(self::ENDPOINT, $payload);

            $latencyMs = (int) round((microtime(true) - $startedAt) * 1000);

            if (! $resp->ok()) {
                $error = $resp->json('error.message') ?? "HTTP {$resp->status()}";

                return LlmResponse::error("Anthropic: {$error}", $latencyMs);
            }

            $json = $resp->json();
            $content = $json['content'] ?? [];

            // Extract text + tool_use blocks separately. Anthropic can
            // return both in the same response (a chain-of-thought
            // followed by tool calls).
            $text = '';
            $toolCalls = [];
            foreach ($content as $block) {
                if (($block['type'] ?? null) === 'text') {
                    $text .= $block['text'] ?? '';
                } elseif (($block['type'] ?? null) === 'tool_use') {
                    $toolCalls[] = [
                        'id' => $block['id'],
                        'name' => $block['name'],
                        'arguments' => $block['input'] ?? [],
                        'raw' => $block,
                    ];
                }
            }

            $input = (int) ($json['usage']['input_tokens'] ?? 0);
            $output = (int) ($json['usage']['output_tokens'] ?? 0);

            // Echo the assistant message back into the history so the
            // next round can include it verbatim (required by Anthropic
            // when continuing a tool-use turn).
            $assistantMessage = [
                'role' => 'assistant',
                'content' => $content,
            ];

            return new LlmResponse(
                text: $text,
                inputTokens: $input,
                outputTokens: $output,
                providerCostCents: $request->model->costCentsFor($input, $output),
                latencyMs: $latencyMs,
                ok: true,
                toolCalls: $toolCalls,
                assistantMessage: $assistantMessage,
            );
        } catch (Throwable $e) {
            $latencyMs = (int) round((microtime(true) - $startedAt) * 1000);

            return LlmResponse::error('Anthropic: '.$e->getMessage(), $latencyMs);
        }
    }

    /**
     * Translate the gateway's provider-agnostic message array into
     * Anthropic's expected shape. The gateway emits:
     *  - {role: 'user', content: '...'}
     *  - {role: 'assistant', content: [...]}  (raw content blocks)
     *  - {role: 'tool_result', tool_use_id: '...', content: '...'}
     *
     * Anthropic groups tool_result messages under a single user turn
     * with `content: [{type:'tool_result', ...}]`.
     */
    private function mapMessages(array $messages): array
    {
        $out = [];
        foreach ($messages as $m) {
            $role = $m['role'] ?? 'user';
            if ($role === 'tool_result') {
                $out[] = [
                    'role' => 'user',
                    'content' => [[
                        'type' => 'tool_result',
                        'tool_use_id' => $m['tool_use_id'],
                        'content' => is_string($m['content']) ? $m['content'] : json_encode($m['content']),
                        'is_error' => (bool) ($m['is_error'] ?? false),
                    ]],
                ];
            } elseif ($role === 'assistant') {
                $out[] = [
                    'role' => 'assistant',
                    'content' => $m['content'], // already shaped as content blocks
                ];
            } else {
                $out[] = [
                    'role' => 'user',
                    'content' => is_string($m['content']) ? $m['content'] : json_encode($m['content']),
                ];
            }
        }

        return $out;
    }
}
