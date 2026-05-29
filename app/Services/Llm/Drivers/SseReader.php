<?php

namespace App\Services\Llm\Drivers;

use Psr\Http\Message\StreamInterface;

/**
 * Reads an SSE (text/event-stream) PSR-7 body incrementally and invokes a
 * callback with the payload of each `data:` line. Shared by the streaming
 * LLM drivers (Anthropic, OpenAI/Google). Ignores `event:` lines and the
 * OpenAI `[DONE]` sentinel.
 */
class SseReader
{
    public static function read(StreamInterface $body, callable $onData): void
    {
        $buffer = '';

        while (! $body->eof()) {
            $chunk = $body->read(8192);
            if ($chunk === '') {
                // Avoid a busy-loop if the stream momentarily has no data.
                usleep(1000);
                continue;
            }
            $buffer .= $chunk;

            while (($nl = strpos($buffer, "\n")) !== false) {
                $line = rtrim(substr($buffer, 0, $nl), "\r");
                $buffer = substr($buffer, $nl + 1);

                if (! str_starts_with($line, 'data:')) {
                    continue;
                }
                $payload = trim(substr($line, 5));
                if ($payload === '' || $payload === '[DONE]') {
                    continue;
                }
                $onData($payload);
            }
        }
    }
}
