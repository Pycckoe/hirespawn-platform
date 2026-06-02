<?php

namespace App\Services\Github;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * Thin client over the GitHub REST API used by the inbound event handler.
 * Authentication is per installation: each method takes the installation_id
 * and asks GithubAppAuth for a (cached) installation token.
 *
 * Methods return ['ok' => bool, 'error' => ?string, ...] arrays so callers
 * can react without try/catch noise.
 */
class GithubClient
{
    public function __construct(private readonly GithubAppAuth $auth) {}

    public function listInstallationRepos(int $installationId): array
    {
        try {
            $resp = $this->api($installationId)->get('https://api.github.com/installation/repositories', ['per_page' => 100]);
            if (! $resp->successful()) {
                return ['ok' => false, 'repos' => [], 'error' => "HTTP {$resp->status()}"];
            }
            $repos = collect($resp->json('repositories') ?? [])
                ->map(fn ($r) => [
                    'id' => $r['id'],
                    'full_name' => $r['full_name'],
                    'private' => (bool) ($r['private'] ?? false),
                ])->values()->all();

            return ['ok' => true, 'repos' => $repos, 'error' => null];
        } catch (Throwable $e) {
            return ['ok' => false, 'repos' => [], 'error' => $e->getMessage()];
        }
    }

    public function postIssueComment(int $installationId, string $repo, int $number, string $body): array
    {
        return $this->postJson($installationId, "https://api.github.com/repos/{$repo}/issues/{$number}/comments", ['body' => $body]);
    }

    public function addLabels(int $installationId, string $repo, int $number, array $labels): array
    {
        return $this->postJson($installationId, "https://api.github.com/repos/{$repo}/issues/{$number}/labels", ['labels' => array_values($labels)]);
    }

    /**
     * Post a top-level PR review with a summary body. event:
     *   COMMENT  — review without approval (safe default for AI suggestions)
     *   APPROVE  — explicit approval
     *   REQUEST_CHANGES — block merge
     */
    public function postPrReview(int $installationId, string $repo, int $number, string $body, string $event = 'COMMENT'): array
    {
        return $this->postJson($installationId, "https://api.github.com/repos/{$repo}/pulls/{$number}/reviews", [
            'body' => $body,
            'event' => $event,
        ]);
    }

    /**
     * Fetch a PR's diff as text. GitHub returns it via a special media
     * type. Truncates very large diffs so the LLM doesn't get a 500KB
     * dump that explodes its context.
     */
    public function getPullRequestDiff(int $installationId, string $repo, int $number, int $maxBytes = 200_000): array
    {
        try {
            $token = $this->auth->installationToken($installationId);
            if (! $token) {
                return ['ok' => false, 'diff' => '', 'truncated' => false, 'error' => 'no_token'];
            }
            $resp = Http::withToken($token)
                ->withHeaders([
                    'Accept' => 'application/vnd.github.v3.diff',
                    'X-GitHub-Api-Version' => '2022-11-28',
                ])
                ->timeout(45)
                ->get("https://api.github.com/repos/{$repo}/pulls/{$number}");

            if (! $resp->successful()) {
                return ['ok' => false, 'diff' => '', 'truncated' => false, 'error' => "HTTP {$resp->status()}"];
            }
            $body = (string) $resp->body();
            $truncated = strlen($body) > $maxBytes;
            if ($truncated) {
                $body = substr($body, 0, $maxBytes)."\n\n[diff truncated — review the rest on GitHub]";
            }

            return ['ok' => true, 'diff' => $body, 'truncated' => $truncated, 'error' => null];
        } catch (Throwable $e) {
            return ['ok' => false, 'diff' => '', 'truncated' => false, 'error' => $e->getMessage()];
        }
    }

    public function getIssue(int $installationId, string $repo, int $number): array
    {
        $resp = $this->api($installationId)->get("https://api.github.com/repos/{$repo}/issues/{$number}");
        if (! $resp->successful()) {
            return ['error' => $resp->json('message') ?? "HTTP {$resp->status()}"];
        }
        $j = $resp->json();

        return [
            'number' => $j['number'] ?? null,
            'title' => $j['title'] ?? '',
            'body' => mb_substr((string) ($j['body'] ?? ''), 0, 8000),
            'state' => $j['state'] ?? null,
            'labels' => collect($j['labels'] ?? [])->map(fn ($l) => is_array($l) ? ($l['name'] ?? null) : (string) $l)->filter()->values()->all(),
            'author' => $j['user']['login'] ?? null,
            'url' => $j['html_url'] ?? null,
        ];
    }

    public function getPullRequest(int $installationId, string $repo, int $number): array
    {
        $resp = $this->api($installationId)->get("https://api.github.com/repos/{$repo}/pulls/{$number}");
        if (! $resp->successful()) {
            return ['error' => $resp->json('message') ?? "HTTP {$resp->status()}"];
        }
        $j = $resp->json();

        return [
            'number' => $j['number'] ?? null,
            'title' => $j['title'] ?? '',
            'body' => mb_substr((string) ($j['body'] ?? ''), 0, 8000),
            'state' => $j['state'] ?? null,
            'draft' => (bool) ($j['draft'] ?? false),
            'author' => $j['user']['login'] ?? null,
            'additions' => $j['additions'] ?? null,
            'deletions' => $j['deletions'] ?? null,
            'changed_files' => $j['changed_files'] ?? null,
            'url' => $j['html_url'] ?? null,
        ];
    }

    public function searchIssues(int $installationId, string $repo, string $query, int $limit = 10): array
    {
        $q = "repo:{$repo} {$query}";
        $resp = $this->api($installationId)->get('https://api.github.com/search/issues', ['q' => $q, 'per_page' => $limit]);
        if (! $resp->successful()) {
            return ['error' => $resp->json('message') ?? "HTTP {$resp->status()}"];
        }

        return [
            'total_count' => $resp->json('total_count') ?? 0,
            'items' => collect($resp->json('items') ?? [])->take($limit)->map(fn ($i) => [
                'number' => $i['number'] ?? null,
                'title' => $i['title'] ?? '',
                'state' => $i['state'] ?? null,
                'type' => isset($i['pull_request']) ? 'pr' : 'issue',
                'url' => $i['html_url'] ?? null,
            ])->values()->all(),
        ];
    }

    public function getFile(int $installationId, string $repo, string $path, ?string $ref = null): array
    {
        $resp = $this->api($installationId)->get("https://api.github.com/repos/{$repo}/contents/".ltrim($path, '/'), array_filter(['ref' => $ref]));
        if (! $resp->successful()) {
            return ['error' => $resp->json('message') ?? "HTTP {$resp->status()}"];
        }
        $j = $resp->json();
        $content = isset($j['content']) ? (string) base64_decode(str_replace("\n", '', $j['content']), true) : '';
        $truncated = strlen($content) > 50_000;
        if ($truncated) {
            $content = substr($content, 0, 50_000)."\n\n[file truncated]";
        }

        return [
            'path' => $j['path'] ?? $path,
            'sha' => $j['sha'] ?? null,
            'size' => $j['size'] ?? null,
            'content' => $content,
            'truncated' => $truncated,
        ];
    }

    /** Authenticated client for a specific installation. */
    private function api(int $installationId): PendingRequest
    {
        $token = $this->auth->installationToken($installationId);

        return Http::withToken($token ?? '')
            ->withHeaders([
                'Accept' => 'application/vnd.github+json',
                'X-GitHub-Api-Version' => '2022-11-28',
            ])
            ->timeout(30);
    }

    private function postJson(int $installationId, string $url, array $body): array
    {
        try {
            $resp = $this->api($installationId)->post($url, $body);
            if (! $resp->successful()) {
                return ['ok' => false, 'error' => $resp->json('message') ?? "HTTP {$resp->status()}"];
            }

            return ['ok' => true, 'error' => null, 'response' => $resp->json()];
        } catch (Throwable $e) {
            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }
}
