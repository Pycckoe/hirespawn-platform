<?php

namespace App\Services\Llm\Contracts;

use App\Services\Llm\LlmRequest;
use App\Services\Llm\LlmResponse;

/**
 * Optional capability: a driver that can stream the assistant's text token
 * by token. Used only for tool-less single-turn runs (the chat "typing"
 * effect). $onDelta is called with each text fragment as it arrives; the
 * method still returns a complete LlmResponse (full text + usage) at the end.
 */
interface StreamingLlmDriver extends LlmDriver
{
    public function stream(LlmRequest $request, callable $onDelta): LlmResponse;
}
