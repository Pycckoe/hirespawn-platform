<?php

namespace App\Services\Llm;

/**
 * Normalised response from any LLM driver. Every driver maps its native
 * shape into this so callers can ignore provider differences.
 */
class LlmResponse
{
    public function __construct(
        public readonly string $text,
        public readonly int $inputTokens,
        public readonly int $outputTokens,
        public readonly int $providerCostCents,
        public readonly int $latencyMs,
        public readonly bool $ok,
        public readonly ?string $errorMessage = null,
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
