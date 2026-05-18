<?php

namespace App\Services\Llm\Contracts;

use App\Services\Llm\LlmRequest;
use App\Services\Llm\LlmResponse;

interface LlmDriver
{
    public function complete(LlmRequest $request): LlmResponse;
}
