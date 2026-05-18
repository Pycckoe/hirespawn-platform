<?php

namespace App\Services\Llm\Drivers;

use App\Services\Llm\Contracts\LlmDriver;
use App\Services\Llm\LlmRequest;
use App\Services\Llm\LlmResponse;
use Illuminate\Support\Facades\Http;
use Throwable;

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
            'messages' => [
                ['role' => 'user', 'content' => $request->userPrompt],
            ],
        ];
        if ($request->systemPrompt) {
            $payload['system'] = $request->systemPrompt;
        }

        try {
            $resp = Http::withHeaders([
                'x-api-key' => $request->apiKey,
                'anthropic-version' => self::VERSION,
                'content-type' => 'application/json',
            ])
                ->timeout(60)
                ->post(self::ENDPOINT, $payload);

            $latencyMs = (int) round((microtime(true) - $startedAt) * 1000);

            if (! $resp->ok()) {
                $error = $resp->json('error.message') ?? "HTTP {$resp->status()}";

                return LlmResponse::error("Anthropic: {$error}", $latencyMs);
            }

            $json = $resp->json();
            $text = collect($json['content'] ?? [])
                ->where('type', 'text')
                ->pluck('text')
                ->implode('');

            $input = (int) ($json['usage']['input_tokens'] ?? 0);
            $output = (int) ($json['usage']['output_tokens'] ?? 0);

            return new LlmResponse(
                text: $text,
                inputTokens: $input,
                outputTokens: $output,
                providerCostCents: $request->model->costCentsFor($input, $output),
                latencyMs: $latencyMs,
                ok: true,
            );
        } catch (Throwable $e) {
            $latencyMs = (int) round((microtime(true) - $startedAt) * 1000);

            return LlmResponse::error('Anthropic: '.$e->getMessage(), $latencyMs);
        }
    }
}
