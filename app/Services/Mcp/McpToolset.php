<?php

namespace App\Services\Mcp;

use App\Models\Subscription;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Builds the LLM tool catalogue contributed by a subscription's connected
 * MCP servers, plus a dispatch map so the gateway can route a tool call
 * back to the right server + original tool name.
 *
 * Tool names are namespaced "mcp_<connId>_<tool>" (truncated to 64 chars
 * to satisfy Anthropic/OpenAI tool-name limits) to avoid collisions with
 * the agent's own skills and across servers.
 */
class McpToolset
{
    public function __construct(private readonly McpClient $client) {}

    /**
     * @return array{tools: array<int, array>, dispatch: array<string, array{connection: \App\Models\McpConnection, tool: string}>}
     */
    public function build(Subscription $subscription, string $provider): array
    {
        $connections = $subscription->mcpConnections()->where('is_active', true)->get();
        $tools = [];
        $dispatch = [];

        foreach ($connections as $connection) {
            // Prefer the cached tool list (populated on connect/test) so we
            // don't hit every MCP server over the network on every agent run.
            // Fall back to a live probe only when there's no cache yet.
            $cached = $connection->tools_cache;
            if (! is_array($cached) || $cached === []) {
                try {
                    $result = $this->client->listTools($connection);
                } catch (Throwable $e) {
                    Log::warning('MCP listTools threw', ['connection' => $connection->id, 'error' => $e->getMessage()]);
                    continue;
                }
                if (! $result['ok']) {
                    continue;
                }
                $cached = $result['tools'];
            }

            foreach ($cached as $tool) {
                if (empty($tool['name'])) {
                    continue;
                }
                $namespaced = $this->namespacedName($connection->id, $tool['name']);
                if (isset($dispatch[$namespaced])) {
                    continue;
                }
                $dispatch[$namespaced] = ['connection' => $connection, 'tool' => $tool['name']];
                $schema = ($tool['inputSchema'] ?? null) ?: ['type' => 'object', 'properties' => new \stdClass()];
                $description = trim(($connection->label ? "[{$connection->label}] " : '').($tool['description'] ?? ''));

                $tools[] = $this->shapeFor($provider, $namespaced, $description, $schema);
            }
        }

        return ['tools' => array_values(array_filter($tools)), 'dispatch' => $dispatch];
    }

    private function namespacedName(int $connectionId, string $tool): string
    {
        $clean = preg_replace('/[^a-zA-Z0-9_-]/', '_', $tool);

        return substr("mcp_{$connectionId}_{$clean}", 0, 64);
    }

    private function shapeFor(string $provider, string $name, string $description, array $schema): ?array
    {
        return match ($provider) {
            'anthropic' => [
                'name' => $name,
                'description' => $description,
                'input_schema' => $schema,
            ],
            'openai', 'google' => [
                'type' => 'function',
                'function' => [
                    'name' => $name,
                    'description' => $description,
                    'parameters' => $schema,
                ],
            ],
            default => null,
        };
    }
}
