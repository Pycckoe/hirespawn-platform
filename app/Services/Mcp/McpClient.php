<?php

namespace App\Services\Mcp;

use App\Models\McpConnection;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * Minimal client for remote MCP (Model Context Protocol) servers over the
 * "Streamable HTTP" transport: JSON-RPC 2.0 POSTed to a single endpoint.
 *
 * We run the spec handshake (initialize → notifications/initialized) then
 * the operation (tools/list or tools/call) within one logical call, reusing
 * the Mcp-Session-Id header the server may hand back. Responses come back as
 * either application/json or an SSE stream (text/event-stream); we parse
 * both. Everything is best-effort and short-timeout: a slow or broken MCP
 * server must never hang or break an agent run.
 *
 * Spec: https://modelcontextprotocol.io/specification (2025-06-18)
 */
class McpClient
{
    private const PROTOCOL_VERSION = '2025-06-18';

    private const TIMEOUT = 20;

    /**
     * List the tools a server exposes.
     *
     * @return array{ok: bool, tools: array<int, array{name:string, description:?string, inputSchema:array}>, error: ?string}
     */
    public function listTools(McpConnection $connection): array
    {
        try {
            [$http, $sessionId] = $this->handshake($connection);
            if (! $http) {
                return ['ok' => false, 'tools' => [], 'error' => $sessionId]; // $sessionId carries the error here
            }

            $result = $this->rpc($http, $connection->url, 'tools/list', new \stdClass(), $sessionId);
            if (! $result['ok']) {
                return ['ok' => false, 'tools' => [], 'error' => $result['error']];
            }

            $tools = [];
            foreach (($result['result']['tools'] ?? []) as $t) {
                if (empty($t['name'])) {
                    continue;
                }
                $tools[] = [
                    'name' => $t['name'],
                    'description' => $t['description'] ?? '',
                    'inputSchema' => $t['inputSchema'] ?? ['type' => 'object', 'properties' => new \stdClass()],
                ];
            }

            return ['ok' => true, 'tools' => $tools, 'error' => null];
        } catch (Throwable $e) {
            return ['ok' => false, 'tools' => [], 'error' => $e->getMessage()];
        }
    }

    /**
     * Call a tool by name with arguments.
     *
     * @return array{ok: bool, content: mixed, error: ?string}
     */
    public function callTool(McpConnection $connection, string $name, array $arguments): array
    {
        try {
            [$http, $sessionId] = $this->handshake($connection);
            if (! $http) {
                return ['ok' => false, 'content' => null, 'error' => $sessionId];
            }

            $result = $this->rpc($http, $connection->url, 'tools/call', [
                'name' => $name,
                'arguments' => empty($arguments) ? new \stdClass() : $arguments,
            ], $sessionId);

            if (! $result['ok']) {
                return ['ok' => false, 'content' => null, 'error' => $result['error']];
            }

            // MCP tool results carry a `content` array of blocks; flatten the
            // text blocks for the LLM. isError marks tool-level failures.
            $payload = $result['result'] ?? [];
            $text = collect($payload['content'] ?? [])
                ->map(fn ($b) => is_array($b) ? ($b['text'] ?? json_encode($b)) : (string) $b)
                ->implode("\n");

            return [
                'ok' => ! ($payload['isError'] ?? false),
                'content' => $text !== '' ? $text : ($payload['structuredContent'] ?? $payload),
                'error' => ($payload['isError'] ?? false) ? 'tool_error' : null,
            ];
        } catch (Throwable $e) {
            return ['ok' => false, 'content' => null, 'error' => $e->getMessage()];
        }
    }

    /**
     * Build the HTTP client + run initialize/initialized. Returns
     * [PendingRequest, sessionId|null] on success, or [null, errorMessage]
     * on failure.
     *
     * @return array{0: ?PendingRequest, 1: ?string}
     */
    private function handshake(McpConnection $connection): array
    {
        $headers = [
            'Content-Type' => 'application/json',
            'Accept' => 'application/json, text/event-stream',
            'MCP-Protocol-Version' => self::PROTOCOL_VERSION,
        ];
        if ($connection->auth_type === 'bearer' && $connection->decryptedToken()) {
            $headers['Authorization'] = 'Bearer '.$connection->decryptedToken();
        }

        $http = Http::withHeaders($headers)->timeout(self::TIMEOUT);

        $initResp = $http->post($connection->url, $this->envelope('initialize', [
            'protocolVersion' => self::PROTOCOL_VERSION,
            'capabilities' => new \stdClass(),
            'clientInfo' => ['name' => 'Hirespawn', 'version' => '1.0'],
        ]));

        if (! $initResp->successful()) {
            return [null, "MCP initialize failed: HTTP {$initResp->status()}"];
        }

        $sessionId = $initResp->header('Mcp-Session-Id') ?: null;

        // initialized notification (best-effort; servers may ignore the body).
        $notifyHeaders = $sessionId ? ['Mcp-Session-Id' => $sessionId] : [];
        try {
            $http->withHeaders($notifyHeaders)->post($connection->url, [
                'jsonrpc' => '2.0',
                'method' => 'notifications/initialized',
            ]);
        } catch (Throwable) {
            // Non-fatal — proceed to the operation.
        }

        return [$http, $sessionId];
    }

    /**
     * POST one JSON-RPC request and return the parsed result.
     *
     * @return array{ok: bool, result: mixed, error: ?string}
     */
    private function rpc(PendingRequest $http, string $url, string $method, mixed $params, ?string $sessionId): array
    {
        $envelope = $this->envelope($method, $params);
        $req = $sessionId ? $http->withHeaders(['Mcp-Session-Id' => $sessionId]) : $http;
        $resp = $req->post($url, $envelope);

        if (! $resp->successful()) {
            return ['ok' => false, 'result' => null, 'error' => "HTTP {$resp->status()}"];
        }

        $json = $this->decode($resp->body(), (string) $resp->header('Content-Type'), $envelope['id']);
        if ($json === null) {
            return ['ok' => false, 'result' => null, 'error' => 'Unparseable MCP response.'];
        }
        if (isset($json['error'])) {
            return ['ok' => false, 'result' => null, 'error' => $json['error']['message'] ?? 'MCP error.'];
        }

        return ['ok' => true, 'result' => $json['result'] ?? [], 'error' => null];
    }

    private function envelope(string $method, mixed $params): array
    {
        return [
            'jsonrpc' => '2.0',
            'id' => bin2hex(random_bytes(8)),
            'method' => $method,
            'params' => $params,
        ];
    }

    /**
     * Decode a JSON-RPC response that may be plain JSON or an SSE stream.
     * For SSE we scan `data:` lines and return the JSON object whose id
     * matches the request (or the last decodable object as a fallback).
     */
    private function decode(string $body, string $contentType, string $expectedId): ?array
    {
        $body = trim($body);
        if ($body === '') {
            return null;
        }

        if (! str_contains($contentType, 'text/event-stream') && ! str_starts_with($body, 'event:') && ! str_starts_with($body, 'data:')) {
            $decoded = json_decode($body, true);

            return is_array($decoded) ? $decoded : null;
        }

        $fallback = null;
        foreach (preg_split('/\r\n|\n|\r/', $body) as $line) {
            $line = trim($line);
            if (! str_starts_with($line, 'data:')) {
                continue;
            }
            $payload = trim(substr($line, 5));
            if ($payload === '' || $payload === '[DONE]') {
                continue;
            }
            $decoded = json_decode($payload, true);
            if (! is_array($decoded)) {
                continue;
            }
            if (($decoded['id'] ?? null) === $expectedId) {
                return $decoded;
            }
            $fallback = $decoded;
        }

        return $fallback;
    }
}
