<?php

namespace App\Services\Llm\Drivers;

use App\Services\Llm\Contracts\StreamingLlmDriver;
use App\Services\Llm\LlmRequest;
use App\Services\Llm\LlmResponse;
use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * OpenAI Chat Completions API driver. Handles multi-turn conversations
 * + native function tool-use. Spec:
 * https://platform.openai.com/docs/guides/function-calling
 */
class OpenAiDriver implements StreamingLlmDriver
{
    private const ENDPOINT = 'https://api.openai.com/v1/chat/completions';

    /**
     * Chat-completions endpoint. Subclasses (e.g. GoogleDriver) override
     * this to point at an OpenAI-compatible endpoint.
     */
    protected function endpoint(): string
    {
        return self::ENDPOINT;
    }

    /** Provider name used in error messages. */
    protected function label(): string
    {
        return 'OpenAI';
    }

    /**
     * Stream a tool-less completion via chat/completions stream=true.
     * Emits each delta.content chunk through $onDelta and returns the full
     * LlmResponse once [DONE] arrives. include_usage gives us token counts
     * in the final chunk.
     */
    public function stream(LlmRequest $request, callable $onDelta): LlmResponse
    {
        $startedAt = microtime(true);

        $messages = [];
        if ($request->systemPrompt) {
            $messages[] = ['role' => 'system', 'content' => $request->systemPrompt];
        }
        foreach ($request->messages as $m) {
            $messages[] = $this->mapMessage($m);
        }

        $payload = [
            'model' => $request->model->api_id,
            'messages' => $messages,
            'max_completion_tokens' => $request->maxOutputTokens,
            'stream' => true,
            'stream_options' => ['include_usage' => true],
        ];

        try {
            $resp = Http::withHeaders([
                'Authorization' => 'Bearer '.$request->apiKey,
                'Content-Type' => 'application/json',
            ])
                ->withOptions(['stream' => true])
                ->timeout(180)
                ->post($this->endpoint(), $payload);

            if (! $resp->successful()) {
                $error = $resp->json('error.message') ?? "HTTP {$resp->status()}";

                return LlmResponse::error("{$this->label()}: {$error}", (int) round((microtime(true) - $startedAt) * 1000));
            }

            $text = '';
            $input = 0;
            $output = 0;

            SseReader::read($resp->toPsrResponse()->getBody(), function (string $payloadLine) use (&$text, &$input, &$output, $onDelta) {
                $json = json_decode($payloadLine, true);
                if (! is_array($json)) {
                    return;
                }
                $chunk = (string) ($json['choices'][0]['delta']['content'] ?? '');
                if ($chunk !== '') {
                    $text .= $chunk;
                    $onDelta($chunk);
                }
                // The final chunk (stream_options.include_usage) carries totals.
                if (isset($json['usage'])) {
                    $input = (int) ($json['usage']['prompt_tokens'] ?? $input);
                    $output = (int) ($json['usage']['completion_tokens'] ?? $output);
                }
            });

            $latencyMs = (int) round((microtime(true) - $startedAt) * 1000);

            return new LlmResponse(
                text: $text,
                inputTokens: $input,
                outputTokens: $output,
                providerCostCents: $request->model->costCentsFor($input, $output),
                latencyMs: $latencyMs,
                ok: true,
            );
        } catch (Throwable $e) {
            return LlmResponse::error($this->label().': '.$e->getMessage(), (int) round((microtime(true) - $startedAt) * 1000));
        }
    }

    public function complete(LlmRequest $request): LlmResponse
    {
        $startedAt = microtime(true);

        $messages = [];
        if ($request->systemPrompt) {
            $messages[] = ['role' => 'system', 'content' => $request->systemPrompt];
        }
        foreach ($request->messages as $m) {
            $messages[] = $this->mapMessage($m);
        }

        $payload = [
            'model' => $request->model->api_id,
            'messages' => $messages,
            'max_completion_tokens' => $request->maxOutputTokens,
        ];
        if (! empty($request->tools)) {
            $payload['tools'] = $request->tools;
        }

        try {
            $resp = Http::withHeaders([
                'Authorization' => 'Bearer '.$request->apiKey,
                'Content-Type' => 'application/json',
            ])
                ->timeout(120)
                ->post($this->endpoint(), $payload);

            $latencyMs = (int) round((microtime(true) - $startedAt) * 1000);

            if (! $resp->ok()) {
                $error = $resp->json('error.message') ?? "HTTP {$resp->status()}";

                return LlmResponse::error("{$this->label()}: {$error}", $latencyMs);
            }

            $json = $resp->json();
            $message = $json['choices'][0]['message'] ?? [];
            $text = (string) ($message['content'] ?? '');

            $toolCalls = [];
            foreach (($message['tool_calls'] ?? []) as $call) {
                $argsRaw = $call['function']['arguments'] ?? '{}';
                $args = is_string($argsRaw) ? (json_decode($argsRaw, true) ?? []) : (array) $argsRaw;
                $toolCalls[] = [
                    'id' => $call['id'],
                    'name' => $call['function']['name'] ?? '',
                    'arguments' => $args,
                    'raw' => $call,
                ];
            }

            $input = (int) ($json['usage']['prompt_tokens'] ?? 0);
            $output = (int) ($json['usage']['completion_tokens'] ?? 0);

            // Echo the assistant message back as history. OpenAI wants
            // both `content` and `tool_calls` present when continuing
            // a tool-use turn.
            $assistantMessage = [
                'role' => 'assistant',
                'content' => $text ?: null,
            ];
            if (! empty($message['tool_calls'])) {
                $assistantMessage['tool_calls'] = $message['tool_calls'];
            }

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

            return LlmResponse::error($this->label().': '.$e->getMessage(), $latencyMs);
        }
    }

    /**
     * Translate one gateway message into OpenAI shape. Gateway emits
     * `tool_result` rows; OpenAI calls them `tool` messages and wants
     * `tool_call_id` + plain text content.
     */
    private function mapMessage(array $m): array
    {
        $role = $m['role'] ?? 'user';

        if ($role === 'tool_result') {
            return [
                'role' => 'tool',
                'tool_call_id' => $m['tool_use_id'],
                'content' => is_string($m['content']) ? $m['content'] : json_encode($m['content']),
            ];
        }

        if ($role === 'assistant' && isset($m['content']) && is_array($m['content'])) {
            // Anthropic-style content blocks were stored — flatten.
            $text = collect($m['content'])
                ->where('type', 'text')
                ->pluck('text')
                ->implode('');

            return ['role' => 'assistant', 'content' => $text];
        }

        return [
            'role' => $role,
            'content' => is_string($m['content']) ? $m['content'] : json_encode($m['content']),
        ];
    }
}
