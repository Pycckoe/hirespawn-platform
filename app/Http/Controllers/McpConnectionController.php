<?php

namespace App\Http\Controllers;

use App\Models\McpConnection;
use App\Models\Subscription;
use App\Services\Mcp\McpClient;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * Buyer-side CRUD for a deployment's MCP server connections. On create and
 * on explicit "test" we probe the server (initialize + tools/list) and
 * cache the tool list + status so the configure UI shows whether it works.
 */
class McpConnectionController extends Controller
{
    public function store(Request $request, Subscription $subscription, McpClient $client): RedirectResponse
    {
        $this->authorize($request, $subscription);

        $validated = $request->validate([
            'label' => ['required', 'string', 'max:120'],
            'url' => ['required', 'url', 'max:500'],
            'auth_type' => ['required', 'in:none,bearer'],
            'token' => ['nullable', 'string', 'max:1000'],
        ]);

        $connection = new McpConnection([
            'subscription_id' => $subscription->id,
            'label' => $validated['label'],
            'url' => $validated['url'],
            'auth_type' => $validated['auth_type'],
            'is_active' => true,
            'status' => 'unknown',
        ]);
        if ($validated['auth_type'] === 'bearer') {
            $connection->setToken($validated['token'] ?? null);
        }
        $connection->subscription_id = $subscription->id;
        $connection->save();

        $this->probe($connection, $client);

        audit('mcp.connect', $connection, [
            'subscription_id' => $subscription->id,
            'url' => $connection->url,
            'status' => $connection->status,
        ]);

        $msg = $connection->status === 'ok'
            ? "Connected \"{$connection->label}\" — {$connection->tool_count} tools available."
            : "Saved \"{$connection->label}\", but the test failed: {$connection->status_message}";

        return back()->with('status', $msg);
    }

    public function test(Request $request, Subscription $subscription, McpConnection $connection, McpClient $client): RedirectResponse
    {
        $this->authorize($request, $subscription);
        abort_unless($connection->subscription_id === $subscription->id, 404);

        $this->probe($connection, $client);

        return back()->with('status', $connection->status === 'ok'
            ? "\"{$connection->label}\" OK — {$connection->tool_count} tools."
            : "\"{$connection->label}\" failed: {$connection->status_message}");
    }

    public function destroy(Request $request, Subscription $subscription, McpConnection $connection): RedirectResponse
    {
        $this->authorize($request, $subscription);
        abort_unless($connection->subscription_id === $subscription->id, 404);

        $label = $connection->label;
        $connection->delete();
        audit('mcp.disconnect', null, ['subscription_id' => $subscription->id, 'label' => $label]);

        return back()->with('status', "Removed MCP server \"{$label}\".");
    }

    private function probe(McpConnection $connection, McpClient $client): void
    {
        $result = $client->listTools($connection);
        $connection->forceFill([
            'status' => $result['ok'] ? 'ok' : 'failed',
            'status_message' => $result['ok'] ? null : ($result['error'] ?: 'Connection failed.'),
            'tool_count' => $result['ok'] ? count($result['tools']) : 0,
            // Cache the FULL tool defs (incl. inputSchema) so agent runs can
            // expose them to the LLM without a live network round-trip per run.
            'tools_cache' => $result['ok']
                ? collect($result['tools'])->map(fn ($t) => [
                    'name' => $t['name'],
                    'description' => $t['description'],
                    'inputSchema' => $t['inputSchema'] ?? ['type' => 'object', 'properties' => new \stdClass()],
                ])->values()->all()
                : null,
            'checked_at' => now(),
        ])->save();
    }

    private function authorize(Request $request, Subscription $subscription): void
    {
        $user = $request->user();
        abort_unless($user && $subscription->buyer_id === $user->id, 403);
    }
}
