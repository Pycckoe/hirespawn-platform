<?php

namespace App\Services\Llm;

use App\Models\LlmModel;

/**
 * One round-trip to an LLM. Carries the full conversation `messages`
 * array (so the driver can do multi-turn tool-use without losing
 * context) plus the tool catalogue the agent exposes.
 */
class LlmRequest
{
    /**
     * @param array<int, array<string, mixed>> $messages provider-agnostic conversation history
     * @param array<int, array<string, mixed>> $tools provider-specific tool definitions
     */
    public function __construct(
        public readonly LlmModel $model,
        public readonly string $apiKey,
        public readonly ?string $systemPrompt,
        public readonly array $messages,
        public readonly int $maxOutputTokens,
        public readonly array $tools = [],
    ) {}
}
