<?php

namespace App\Services\Llm;

use App\Models\LlmModel;

class LlmRequest
{
    public function __construct(
        public readonly LlmModel $model,
        public readonly string $apiKey,
        public readonly ?string $systemPrompt,
        public readonly string $userPrompt,
        public readonly int $maxOutputTokens,
    ) {}
}
