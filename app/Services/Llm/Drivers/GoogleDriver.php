<?php

namespace App\Services\Llm\Drivers;

/**
 * Google Gemini driver via Google's OpenAI-compatible endpoint, so we
 * reuse the OpenAI chat-completions request/response shape (messages,
 * tools, tool_calls). Spec:
 * https://ai.google.dev/gemini-api/docs/openai
 *
 * The seller's Google AI Studio API key is passed as a Bearer token, the
 * same way OpenAiDriver sends the OpenAI key. model->api_id must be the
 * Gemini model id (e.g. "gemini-2.5-pro").
 */
class GoogleDriver extends OpenAiDriver
{
    protected function endpoint(): string
    {
        return 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
    }

    protected function label(): string
    {
        return 'Google';
    }
}
