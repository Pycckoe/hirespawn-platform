<?php

namespace App\Jobs;

use App\Models\GithubInstallation;
use App\Models\Subscription;
use App\Services\Agents\RunRecorder;
use App\Services\Github\GithubAppAuth;
use App\Services\Github\GithubClient;
use App\Services\Llm\LlmGateway;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Routes a verified GitHub webhook to the right behaviour: PR review,
 * issue triage, or an @mention reply. Runs in-process via
 * dispatchAfterResponse so the webhook endpoint can ack within GitHub's
 * 10s timeout without a queue worker.
 *
 * Routing model (mirrors Slack): the buyer is the user who installed the
 * App (GithubInstallation.user_id); the agent is whichever of that
 * buyer's subscriptions has this repo in settings.routing.github.repos[].
 * Falls back to the buyer's single Github-routed agent.
 */
class HandleGithubEvent
{
    use Dispatchable;

    public function __construct(
        public int $installationId,
        public string $event,
        public string $action,
        public array $payload,
    ) {}

    public function handle(LlmGateway $gateway, RunRecorder $recorder): void
    {
        $auth = GithubAppAuth::fromConfig();
        if (! $auth) {
            Log::warning('[github] App not configured, dropping event');

            return;
        }
        $client = new GithubClient($auth);

        $install = GithubInstallation::query()->where('installation_id', $this->installationId)->first();
        if (! $install) {
            Log::warning('[github] no installation row', ['id' => $this->installationId]);

            return;
        }
        $buyer = $install->user;
        if (! $buyer) {
            return;
        }
        $repo = (string) ($this->payload['repository']['full_name'] ?? '');
        $subscription = $this->matchSubscription($buyer, $repo);

        Log::info('[github] routing', [
            'event' => $this->event,
            'action' => $this->action,
            'buyer' => $buyer->id,
            'repo' => $repo,
            'subscription' => $subscription?->id,
        ]);

        if (! $subscription || ! $subscription->agent?->llm_model_id) {
            return;
        }

        // Dispatch to layer-specific handler.
        match (true) {
            // Layer C — @-mention assistant
            $this->event === 'issue_comment' && $this->action === 'created'
                => $this->handleIssueComment($gateway, $recorder, $client, $subscription, $buyer),
            $this->event === 'pull_request_review_comment' && $this->action === 'created'
                => $this->handleIssueComment($gateway, $recorder, $client, $subscription, $buyer),

            // Layer B — Issue Triager
            $this->event === 'issues' && $this->action === 'opened'
                => $this->handleIssueOpened($gateway, $recorder, $client, $subscription, $buyer),

            // Layer A — PR Reviewer
            $this->event === 'pull_request' && in_array($this->action, ['opened', 'synchronize', 'reopened'], true)
                => $this->handlePullRequest($gateway, $recorder, $client, $subscription, $buyer),

            default => null, // event we don't care about
        };
    }

    // ── Layer C: @-mention in issue/PR/review comments ──────────────────
    private function handleIssueComment(LlmGateway $gateway, RunRecorder $recorder, GithubClient $client, Subscription $subscription, $buyer): void
    {
        $comment = $this->payload['comment'] ?? [];
        $issue = $this->payload['issue'] ?? $this->payload['pull_request'] ?? [];
        $text = (string) ($comment['body'] ?? '');
        $author = strtolower((string) ($comment['user']['login'] ?? ''));

        // Skip bot comments (incl. our own) — author ends in [bot] or is
        // explicitly type=Bot.
        if (str_ends_with($author, '[bot]') || ($comment['user']['type'] ?? null) === 'Bot') {
            return;
        }
        if (! $this->mentionsAgent($text, $subscription->agent->name)) {
            return;
        }

        $prompt = $this->stripMentions($text);
        if ($prompt === '') {
            return;
        }

        $repo = (string) $this->payload['repository']['full_name'];
        $issueNumber = (int) ($issue['number'] ?? 0);
        if ($issueNumber <= 0) {
            return;
        }

        $reply = $this->runAgent($gateway, $recorder, $subscription, $buyer, "GitHub comment from @{$author} in {$repo}#{$issueNumber}:\n\n{$prompt}", 'github.comment');
        if ($reply !== null) {
            $client->postIssueComment($this->installationId, $repo, $issueNumber, $reply);
        }
    }

    // ── Layer B: new issue → classify + comment + label ────────────────
    private function handleIssueOpened(LlmGateway $gateway, RunRecorder $recorder, GithubClient $client, Subscription $subscription, $buyer): void
    {
        $issue = $this->payload['issue'] ?? [];
        $repo = (string) $this->payload['repository']['full_name'];
        $number = (int) ($issue['number'] ?? 0);
        if ($number <= 0) {
            return;
        }
        $author = (string) ($issue['user']['login'] ?? 'someone');
        $title = (string) ($issue['title'] ?? '');
        $body = (string) ($issue['body'] ?? '');

        $prompt = "Triage this new GitHub issue. Reply with JSON:\n"
            ."{\"labels\":[...one or two of: bug, feature, question, docs, duplicate, needs-info...], \"comment\":\"a short, friendly first response\"}\n\n"
            ."Repo: {$repo}\nIssue #{$number} by @{$author}\nTitle: {$title}\nBody:\n{$body}";

        $raw = $this->runAgent($gateway, $recorder, $subscription, $buyer, $prompt, 'github.issue_open');
        if ($raw === null) {
            return;
        }

        // The LLM might wrap the JSON in prose or fenced blocks — extract.
        $decoded = $this->extractJson($raw);
        $comment = is_array($decoded) ? (string) ($decoded['comment'] ?? '') : '';
        $labels = is_array($decoded) ? array_values(array_filter((array) ($decoded['labels'] ?? []), 'is_string')) : [];

        if ($comment !== '') {
            $client->postIssueComment($this->installationId, $repo, $number, $comment);
        }
        if ($labels) {
            $client->addLabels($this->installationId, $repo, $number, array_slice($labels, 0, 4));
        }
    }

    // ── Layer A: PR opened/updated → fetch diff, summary review ────────
    private function handlePullRequest(LlmGateway $gateway, RunRecorder $recorder, GithubClient $client, Subscription $subscription, $buyer): void
    {
        $pr = $this->payload['pull_request'] ?? [];
        $repo = (string) $this->payload['repository']['full_name'];
        $number = (int) ($pr['number'] ?? 0);
        if ($number <= 0) {
            return;
        }
        $author = (string) ($pr['user']['login'] ?? 'someone');
        if (str_ends_with(strtolower($author), '[bot]')) {
            return; // don't review bot PRs
        }
        $title = (string) ($pr['title'] ?? '');
        $body = (string) ($pr['body'] ?? '');

        $diffResult = $client->getPullRequestDiff($this->installationId, $repo, $number);
        $diff = $diffResult['ok'] ? $diffResult['diff'] : '';
        if ($diff === '') {
            Log::warning('[github] could not fetch diff', ['repo' => $repo, 'pr' => $number, 'error' => $diffResult['error'] ?? null]);

            return;
        }

        $prompt = "You are reviewing pull request #{$number} in {$repo} by @{$author}.\n"
            .'Title: '.$title."\n"
            .($body !== '' ? "Description:\n{$body}\n\n" : "\n")
            ."Diff (unified):\n```diff\n{$diff}\n```\n\n"
            ."Write a concise PR review with prioritised findings (blocker / warning / nit) and short, actionable suggestions. "
            ."Group by severity; reference file paths + line ranges from the diff. Keep it scannable. End with a one-line overall verdict.";

        $review = $this->runAgent($gateway, $recorder, $subscription, $buyer, $prompt, 'github.pr_review');
        if ($review !== null) {
            $client->postPrReview($this->installationId, $repo, $number, $review, event: 'COMMENT');
        }
    }

    // ── Shared helpers ─────────────────────────────────────────────────

    /**
     * Run the agent + record usage. Returns the reply text, or null on
     * failure (a quiet failure beats spamming GitHub with error noise).
     */
    private function runAgent(LlmGateway $gateway, RunRecorder $recorder, Subscription $subscription, $buyer, string $prompt, string $source): ?string
    {
        $agent = $subscription->agent;
        $profile = $buyer->buyerProfile()->firstOrCreate([], []);
        $cost = (int) $agent->power_cost;
        if ($profile->power_balance < $cost) {
            Log::warning('[github] insufficient power', ['buyer' => $buyer->id, 'cost' => $cost]);

            return null;
        }
        $response = $gateway->run($agent->fresh(['llmModel', 'seller', 'skills', 'settingDefs']), $prompt, $subscription);
        $recorder->record($subscription, $agent, $profile, $cost, $prompt, $response, source: $source);
        if (! $response->ok || $response->text === '') {
            Log::warning('[github] agent run failed', ['err' => $response->errorMessage]);

            return null;
        }

        return $response->text;
    }

    private function matchSubscription($buyer, string $repo): ?Subscription
    {
        $target = strtolower($repo);
        $githubRouted = $buyer->subscriptions()
            ->whereIn('status', ['active', 'paused'])
            ->with('agent')
            ->get()
            ->filter(fn (Subscription $s) => is_array(($s->settings['routing']['github']['repos'] ?? null)));

        $match = $githubRouted->first(function (Subscription $s) use ($target) {
            $repos = collect((array) $s->settings['routing']['github']['repos']);

            return $repos->map(fn ($r) => strtolower((string) $r))->contains($target);
        });

        return $match ?: ($githubRouted->count() === 1 ? $githubRouted->first() : null);
    }

    private function mentionsAgent(string $text, string $agentName): bool
    {
        // Accept @hirespawn, @hirespawn-bot, or @<agent slug>. We treat any
        // @mention of one of these as addressed to us; the comment author
        // filter above already excluded our own posts.
        $needles = ['@hirespawn', '@hirespawn-bot', '@'.Str::slug($agentName)];
        $haystack = strtolower($text);
        foreach ($needles as $n) {
            if (str_contains($haystack, strtolower($n))) {
                return true;
            }
        }

        return false;
    }

    private function stripMentions(string $text): string
    {
        return trim((string) preg_replace('/@[A-Za-z0-9_\-\[\]]+/u', '', $text));
    }

    /** Pull the first JSON object out of an LLM response, even if wrapped. */
    private function extractJson(string $text): ?array
    {
        // Strip fences if present.
        $text = (string) preg_replace('/```[a-zA-Z]*\s*|```/m', '', $text);
        if (preg_match('/\{[\s\S]*\}/', $text, $m) && ($json = json_decode($m[0], true)) && is_array($json)) {
            return $json;
        }

        return null;
    }
}
