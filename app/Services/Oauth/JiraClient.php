<?php

namespace App\Services\Oauth;

use App\Models\User;
use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * Thin client over Jira Cloud's REST API used by the built-in connector
 * toolset. Auth: the buyer's stored OAuth access token (Atlassian 3LO),
 * refreshed automatically by UserOauthToken::freshAccessToken. The
 * cloudid (site id) we discovered at connect time is stored on the
 * token's account_id and is required in every URL.
 *
 * Spec: https://developer.atlassian.com/cloud/jira/platform/rest/v3/
 */
class JiraClient
{
    public function search(User $user, string $jql, int $limit = 10): array
    {
        return $this->call($user, fn (string $token, string $cloudId) => Http::withToken($token)->timeout(20)
            ->get("https://api.atlassian.com/ex/jira/{$cloudId}/rest/api/3/search", [
                'jql' => $jql,
                'maxResults' => max(1, min(50, $limit)),
                'fields' => 'summary,status,assignee,priority,issuetype,project,updated',
            ]), function (array $j) use ($limit) {
            $issues = collect($j['issues'] ?? [])->take($limit)->map(fn ($i) => [
                'key' => $i['key'] ?? null,
                'summary' => $i['fields']['summary'] ?? '',
                'status' => $i['fields']['status']['name'] ?? null,
                'assignee' => $i['fields']['assignee']['displayName'] ?? null,
                'priority' => $i['fields']['priority']['name'] ?? null,
                'type' => $i['fields']['issuetype']['name'] ?? null,
                'project' => $i['fields']['project']['key'] ?? null,
                'updated' => $i['fields']['updated'] ?? null,
            ])->values()->all();

            return ['ok' => true, 'total' => $j['total'] ?? count($issues), 'issues' => $issues];
        });
    }

    public function getIssue(User $user, string $key): array
    {
        return $this->call($user, fn (string $token, string $cloudId) => Http::withToken($token)->timeout(20)
            ->get("https://api.atlassian.com/ex/jira/{$cloudId}/rest/api/3/issue/".urlencode($key)), function (array $j) {
            return [
                'ok' => true,
                'key' => $j['key'] ?? null,
                'summary' => $j['fields']['summary'] ?? '',
                'description' => self::adfToText($j['fields']['description'] ?? null),
                'status' => $j['fields']['status']['name'] ?? null,
                'assignee' => $j['fields']['assignee']['displayName'] ?? null,
                'reporter' => $j['fields']['reporter']['displayName'] ?? null,
                'priority' => $j['fields']['priority']['name'] ?? null,
                'type' => $j['fields']['issuetype']['name'] ?? null,
                'labels' => $j['fields']['labels'] ?? [],
                'created' => $j['fields']['created'] ?? null,
                'updated' => $j['fields']['updated'] ?? null,
                'url' => isset($j['self']) ? str_replace('/rest/api/3/issue/', '/browse/', (string) $j['self']) : null,
            ];
        });
    }

    public function createIssue(User $user, string $projectKey, string $summary, ?string $description = null, string $issueType = 'Task'): array
    {
        $body = [
            'fields' => [
                'project' => ['key' => $projectKey],
                'summary' => $summary,
                'issuetype' => ['name' => $issueType],
            ],
        ];
        if ($description !== null && $description !== '') {
            $body['fields']['description'] = self::textToAdf($description);
        }

        return $this->call($user, fn (string $token, string $cloudId) => Http::withToken($token)->timeout(20)
            ->post("https://api.atlassian.com/ex/jira/{$cloudId}/rest/api/3/issue", $body), function (array $j) {
            return ['ok' => true, 'key' => $j['key'] ?? null, 'id' => $j['id'] ?? null];
        });
    }

    public function addComment(User $user, string $key, string $body): array
    {
        return $this->call($user, fn (string $token, string $cloudId) => Http::withToken($token)->timeout(20)
            ->post("https://api.atlassian.com/ex/jira/{$cloudId}/rest/api/3/issue/".urlencode($key).'/comment', [
                'body' => self::textToAdf($body),
            ]), function (array $j) {
            return ['ok' => true, 'id' => $j['id'] ?? null];
        });
    }

    /**
     * Shared call wrapper: pulls a fresh token + cloudid, runs the request,
     * normalises errors. The mapOk callback shapes the success payload.
     */
    private function call(User $user, callable $perform, callable $mapOk): array
    {
        $row = $user->oauthTokenFor('jira');
        $access = $row?->freshAccessToken();
        if (! $access) {
            return ['ok' => false, 'error' => 'not_connected'];
        }
        $cloudId = $row?->account_id;
        if (! $cloudId) {
            return ['ok' => false, 'error' => 'Jira site (cloudid) not detected — reconnect Jira on Hirespawn.'];
        }

        try {
            $resp = $perform($access, $cloudId);
            if (! $resp->successful()) {
                $err = $resp->json('errorMessages.0') ?? $resp->json('message') ?? "HTTP {$resp->status()}";

                return ['ok' => false, 'error' => $err];
            }

            return $mapOk((array) $resp->json());
        } catch (Throwable $e) {
            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Convert plain text to Atlassian Document Format (ADF) — the JSON
     * shape Jira v3 expects for description / comment bodies.
     */
    private static function textToAdf(string $text): array
    {
        return [
            'type' => 'doc',
            'version' => 1,
            'content' => [[
                'type' => 'paragraph',
                'content' => [['type' => 'text', 'text' => $text]],
            ]],
        ];
    }

    /** Recursively flatten an ADF document back to plain text. */
    private static function adfToText(mixed $adf): string
    {
        if (! is_array($adf)) {
            return '';
        }
        if (isset($adf['type']) && $adf['type'] === 'text') {
            return (string) ($adf['text'] ?? '');
        }
        $out = '';
        foreach ($adf['content'] ?? [] as $node) {
            $out .= self::adfToText($node);
            if (in_array($node['type'] ?? null, ['paragraph', 'heading', 'bulletList', 'orderedList'], true)) {
                $out .= "\n";
            }
        }

        return trim($out);
    }
}
