<?php

namespace App\Services\Llm;

/**
 * Normalised response from any LLM driver. Every driver maps its native
 * shape into this so callers can ignore provider differences.
 *
 * When the model wants to call a tool, `toolCalls` is non-empty and
 * `text` may be empty. The gateway runs the tools, appends results to
 * the message history, and re-invokes the driver until `toolCalls` is
 * empty (the model's final answer) or maxIterations runs out.
 */
class LlmResponse
{
    /**
     * @param array<int, array<string, mixed>> $toolCalls list of {id, name, arguments(array), raw(provider-shaped)}
     * @param array<string, mixed>|null $assistantMessage provider-shaped assistant message to push back as history
     * @param array<int, array<string, mixed>> $toolCallLog audit trail for usage_events.metadata
     */
    public function __construct(
        public readonly string $text,
        public readonly int $inputTokens,
        public readonly int $outputTokens,
        public readonly int $providerCostCents,
        public readonly int $latencyMs,
        public readonly bool $ok,
        public readonly ?string $errorMessage = null,
        public readonly array $toolCalls = [],
        public readonly ?array $assistantMessage = null,
        public readonly array $toolCallLog = [],
    ) {}

    public static function error(string $message, int $latencyMs = 0): self
    {
        return new self(
            text: '',
            inputTokens: 0,
            outputTokens: 0,
            providerCostCents: 0,
            latencyMs: $latencyMs,
            ok: false,
            errorMessage: $message,
        );
    }
}
