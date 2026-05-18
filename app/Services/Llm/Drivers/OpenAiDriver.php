<?php

namespace App\Services\Llm\Drivers;

use App\Services\Llm\Contracts\LlmDriver;
use App\Services\Llm\LlmRequest;
use App\Services\Llm\LlmResponse;
use Illuminate\Support\Facades\Http;
use Throwable;

class OpenAiDriver implements LlmDriver
{
    private const ENDPOINT = 'https://api.openai.com/v1/chat/completions';

    public function complete(LlmRequest $request): LlmResponse
    {
        $startedAt = microtime(true);

        $messages = [];
        if ($request->systemPrompt) {
            $messages[] = ['role' => 'system', 'content' => $request->systemPrompt];
        }
        $messages[] = ['role' => 'user', 'content' => $request->userPrompt];

        $payload = [
            'model' => $request->model->api_id,
            'messages' => $messages,
            'max_completion_tokens' => $request->maxOutputTokens,
        ];

        try {
            $resp = Http::withHeaders([
                'Authorization' => 'Bearer '.$request->apiKey,
                'Content-Type' => 'application/json',
            ])
                ->timeout(60)
                ->post(self::ENDPOINT, $payload);

            $latencyMs = (int) round((microtime(true) - $startedAt) * 1000);

            if (! $resp->ok()) {
                $error = $resp->json('error.message') ?? "HTTP {$resp->status()}";

                return LlmResponse::error("OpenAI: {$error}", $latencyMs);
            }

            $json = $resp->json();
            $text = (string) ($json['choices'][0]['message']['content'] ?? '');
            $input = (int) ($json['usage']['prompt_tokens'] ?? 0);
            $output = (int) ($json['usage']['completion_tokens'] ?? 0);

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

            return LlmResponse::error('OpenAI: '.$e->getMessage(), $latencyMs);
        }
    }
}
