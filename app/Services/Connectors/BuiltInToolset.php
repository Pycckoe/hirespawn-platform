<?php

namespace App\Services\Connectors;

use App\Models\Subscription;
use App\Services\Github\GithubAppAuth;
use App\Services\Github\GithubClient;
use App\Services\Oauth\GoogleClient;
use App\Services\Oauth\HubspotClient;
use App\Services\Oauth\JiraClient;
use App\Services\Oauth\SlackClient;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Built-in connector tools: a buyer-side, platform-managed extension of the
 * agent's tool catalogue. Every time a buyer connects a service (Slack
 * workspace, GitHub App installation, …), the matching tools become
 * available to ANY agent they rent — no vendor wiring required. Parallels
 * MCP but maintained by us, shaped to the live connection state.
 *
 * Each tool call charges the buyer an admin-configurable amount of Power on
 * top of the agent's per-run cost — that's how we tarif multi-service
 * pipelines without changing the per-agent price.
 */
class BuiltInToolset
{
    public function __construct(
        private readonly SlackClient $slack,
        private readonly GoogleClient $google,
        private readonly JiraClient $jira,
        private readonly HubspotClient $hubspot,
    ) {}

    /**
     * @return array{tools: array, dispatch: array<string, array{provider:string, tool:string}>}
     */
    public function build(Subscription $subscription, string $provider): array
    {
        $tools = [];
        $dispatch = [];
        $buyer = $subscription->buyer;
        if (! $buyer) {
            return ['tools' => [], 'dispatch' => []];
        }

        // GitHub built-ins (when buyer has an App installation).
        if ($buyer->githubInstallation && GithubAppAuth::fromConfig()) {
            foreach ($this->githubToolSpecs() as $spec) {
                $dispatch[$spec['name']] = ['provider' => 'github', 'tool' => $spec['name']];
                $tools[] = $this->shape($provider, $spec['name'], $spec['description'], $spec['parameters']);
            }
        }

        // Slack built-ins (when buyer has a workspace connected).
        if ($buyer->oauthTokenFor('slack')) {
            foreach ($this->slackToolSpecs() as $spec) {
                $dispatch[$spec['name']] = ['provider' => 'slack', 'tool' => $spec['name']];
                $tools[] = $this->shape($provider, $spec['name'], $spec['description'], $spec['parameters']);
            }
        }

        // Google built-ins (when buyer has a Google account connected).
        if ($buyer->oauthTokenFor('google')) {
            foreach ($this->googleToolSpecs() as $spec) {
                $dispatch[$spec['name']] = ['provider' => 'google', 'tool' => $spec['name']];
                $tools[] = $this->shape($provider, $spec['name'], $spec['description'], $spec['parameters']);
            }
        }

        // Jira built-ins (when buyer has a Jira Cloud site connected).
        if ($buyer->oauthTokenFor('jira')) {
            foreach ($this->jiraToolSpecs() as $spec) {
                $dispatch[$spec['name']] = ['provider' => 'jira', 'tool' => $spec['name']];
                $tools[] = $this->shape($provider, $spec['name'], $spec['description'], $spec['parameters']);
            }
        }

        // HubSpot built-ins (when buyer has a HubSpot portal connected).
        if ($buyer->oauthTokenFor('hubspot')) {
            foreach ($this->hubspotToolSpecs() as $spec) {
                $dispatch[$spec['name']] = ['provider' => 'hubspot', 'tool' => $spec['name']];
                $tools[] = $this->shape($provider, $spec['name'], $spec['description'], $spec['parameters']);
            }
        }

        return ['tools' => array_values(array_filter($tools)), 'dispatch' => $dispatch];
    }

    /**
     * Dispatch a tool call to the matching connector. Returns the LLM-facing
     * result (array). Errors are wrapped — never thrown — so the LLM can
     * adapt instead of the whole run blowing up.
     */
    public function execute(array $target, array $arguments, Subscription $subscription): array
    {
        $buyer = $subscription->buyer;
        try {
            return match ($target['provider']) {
                'github' => $this->executeGithub($buyer, $target['tool'], $arguments, $subscription),
                'slack' => $this->executeSlack($buyer, $target['tool'], $arguments, $subscription),
                'google' => $this->executeGoogle($buyer, $target['tool'], $arguments),
                'jira' => $this->executeJira($buyer, $target['tool'], $arguments),
                'hubspot' => $this->executeHubspot($buyer, $target['tool'], $arguments),
                default => ['error' => 'Unknown connector provider: '.$target['provider']],
            };
        } catch (Throwable $e) {
            Log::warning('[builtin] tool failed', ['target' => $target, 'error' => $e->getMessage()]);

            return ['error' => $e->getMessage()];
        }
    }

    // ── GitHub ────────────────────────────────────────────────────────

    private function githubToolSpecs(): array
    {
        return [
            ['name' => 'gh_get_issue', 'description' => 'Fetch a GitHub issue (title, body, state, labels) by repo and number. Use this whenever the user asks about a specific issue.', 'parameters' => [
                'type' => 'object',
                'properties' => [
                    'repo' => ['type' => 'string', 'description' => 'owner/name, e.g. "acme/api"'],
                    'number' => ['type' => 'integer', 'description' => 'Issue number, e.g. 42'],
                ],
                'required' => ['repo', 'number'],
            ]],
            ['name' => 'gh_get_pull_request', 'description' => 'Fetch a pull request (title, body, state, files-changed count, additions/deletions) by repo and number.', 'parameters' => [
                'type' => 'object',
                'properties' => [
                    'repo' => ['type' => 'string'],
                    'number' => ['type' => 'integer'],
                ],
                'required' => ['repo', 'number'],
            ]],
            ['name' => 'gh_search_issues', 'description' => 'Search issues + PRs across a repo. Returns a short ranked list with number, title, state, url.', 'parameters' => [
                'type' => 'object',
                'properties' => [
                    'repo' => ['type' => 'string'],
                    'query' => ['type' => 'string', 'description' => 'Search keywords; supports the standard GitHub issue search syntax.'],
                    'limit' => ['type' => 'integer', 'description' => 'How many results (default 10, max 30).'],
                ],
                'required' => ['repo', 'query'],
            ]],
            ['name' => 'gh_get_file', 'description' => 'Return the text contents of a file in a repo at a ref (default branch if ref omitted). Truncated at 50 KB.', 'parameters' => [
                'type' => 'object',
                'properties' => [
                    'repo' => ['type' => 'string'],
                    'path' => ['type' => 'string', 'description' => 'Path from repo root, e.g. "src/auth/login.ts".'],
                    'ref' => ['type' => 'string', 'description' => 'Branch / tag / commit sha (optional).'],
                ],
                'required' => ['repo', 'path'],
            ]],
            ['name' => 'gh_post_comment', 'description' => 'Post a comment on an issue or pull request.', 'parameters' => [
                'type' => 'object',
                'properties' => [
                    'repo' => ['type' => 'string'],
                    'number' => ['type' => 'integer', 'description' => 'Issue / PR number to comment on.'],
                    'body' => ['type' => 'string', 'description' => 'Markdown body of the comment.'],
                ],
                'required' => ['repo', 'number', 'body'],
            ]],
        ];
    }

    private function executeGithub($buyer, string $tool, array $args, Subscription $subscription): array
    {
        $install = $buyer->githubInstallation;
        if (! $install) {
            return ['error' => 'GitHub is not connected.'];
        }
        $auth = GithubAppAuth::fromConfig();
        if (! $auth) {
            return ['error' => 'GitHub App is not configured.'];
        }

        // The buyer can only call tools against repos this subscription is
        // bound to (or any repo in the installation if the subscription has
        // no routing limit). Prevents cross-tenant leakage via prompt injection.
        $allowedRepos = collect((array) ($subscription->settings['routing']['github']['repos'] ?? []));
        $client = new GithubClient($auth);
        $iid = (int) $install->installation_id;

        $checkRepo = function (?string $repo) use ($allowedRepos): ?string {
            if (! $repo) {
                return 'Missing required arg: repo';
            }
            if ($allowedRepos->isNotEmpty() && ! $allowedRepos->map(fn ($r) => strtolower((string) $r))->contains(strtolower($repo))) {
                return "Repo '{$repo}' is not in this agent's allowed list.";
            }

            return null;
        };

        if ($err = $checkRepo($args['repo'] ?? null)) {
            return ['error' => $err];
        }
        $repo = (string) $args['repo'];

        return match ($tool) {
            'gh_get_issue' => $client->getIssue($iid, $repo, (int) ($args['number'] ?? 0)),
            'gh_get_pull_request' => $client->getPullRequest($iid, $repo, (int) ($args['number'] ?? 0)),
            'gh_search_issues' => $client->searchIssues($iid, $repo, (string) ($args['query'] ?? ''), min(30, max(1, (int) ($args['limit'] ?? 10)))),
            'gh_get_file' => $client->getFile($iid, $repo, (string) ($args['path'] ?? ''), $args['ref'] ?? null),
            'gh_post_comment' => $client->postIssueComment($iid, $repo, (int) ($args['number'] ?? 0), (string) ($args['body'] ?? '')),
            default => ['error' => "Unknown github tool: {$tool}"],
        };
    }

    // ── Slack ────────────────────────────────────────────────────────

    private function slackToolSpecs(): array
    {
        return [
            ['name' => 'slack_post_message', 'description' => "Post a message to a Slack channel the buyer's bot is in. Use this whenever the user asks to share / notify / announce in Slack.", 'parameters' => [
                'type' => 'object',
                'properties' => [
                    'channel' => ['type' => 'string', 'description' => 'Channel name (e.g. "#sales") or ID.'],
                    'text' => ['type' => 'string', 'description' => 'Message body. Markdown is auto-converted to Slack mrkdwn.'],
                    'thread_ts' => ['type' => 'string', 'description' => 'Optional: post as a reply in this thread.'],
                ],
                'required' => ['channel', 'text'],
            ]],
        ];
    }

    private function executeSlack($buyer, string $tool, array $args, Subscription $subscription): array
    {
        return match ($tool) {
            'slack_post_message' => $this->slackPostMessage($buyer, $args),
            default => ['error' => "Unknown slack tool: {$tool}"],
        };
    }

    private function slackPostMessage($buyer, array $args): array
    {
        $channel = (string) ($args['channel'] ?? '');
        $text = (string) ($args['text'] ?? '');
        if ($channel === '' || $text === '') {
            return ['error' => 'channel and text are required.'];
        }
        $result = $this->slack->postMessage($buyer, $channel, $text, $args['thread_ts'] ?? null);

        return $result['ok'] ? ['ok' => true, 'channel' => $channel] : ['error' => $result['error'] ?? 'slack_failed'];
    }

    // ── Google ──────────────────────────────────────────────────────

    private function googleToolSpecs(): array
    {
        return [
            ['name' => 'google_gmail_search', 'description' => "Search the buyer's Gmail inbox using Gmail's query syntax (e.g. 'from:alice@x.com is:unread', 'subject:invoice newer_than:7d'). Returns a short list of matches.", 'parameters' => [
                'type' => 'object',
                'properties' => [
                    'query' => ['type' => 'string', 'description' => 'Gmail search query.'],
                    'limit' => ['type' => 'integer', 'description' => 'Max results (default 10, max 25).'],
                ],
                'required' => ['query'],
            ]],
            ['name' => 'google_gmail_get', 'description' => "Get a single Gmail message's headers + body by its id (returned by google_gmail_search).", 'parameters' => [
                'type' => 'object',
                'properties' => [
                    'id' => ['type' => 'string', 'description' => 'Gmail message id.'],
                ],
                'required' => ['id'],
            ]],
            ['name' => 'google_gmail_send', 'description' => "Send a plain-text email from the buyer's connected Gmail account. Use sparingly — confirm intent first.", 'parameters' => [
                'type' => 'object',
                'properties' => [
                    'to' => ['type' => 'string', 'description' => 'Recipient email address.'],
                    'subject' => ['type' => 'string'],
                    'body' => ['type' => 'string', 'description' => 'Plain-text body.'],
                ],
                'required' => ['to', 'subject', 'body'],
            ]],
            ['name' => 'google_calendar_list_events', 'description' => "List upcoming events on the buyer's primary Google Calendar (ordered by start time).", 'parameters' => [
                'type' => 'object',
                'properties' => [
                    'limit' => ['type' => 'integer', 'description' => 'Max events (default 10, max 25).'],
                ],
            ]],
            ['name' => 'google_drive_search', 'description' => "Search files in the buyer's Google Drive (read-only). Use Drive query syntax, e.g. \"name contains 'budget'\" or \"mimeType='application/pdf'\".", 'parameters' => [
                'type' => 'object',
                'properties' => [
                    'query' => ['type' => 'string', 'description' => 'Drive query.'],
                    'limit' => ['type' => 'integer', 'description' => 'Max results (default 10, max 25).'],
                ],
                'required' => ['query'],
            ]],
        ];
    }

    private function executeGoogle($buyer, string $tool, array $args): array
    {
        return match ($tool) {
            'google_gmail_search' => $this->google->gmailSearch($buyer, (string) ($args['query'] ?? ''), (int) ($args['limit'] ?? 10)),
            'google_gmail_get' => $this->google->gmailGet($buyer, (string) ($args['id'] ?? '')),
            'google_gmail_send' => $this->google->gmailSend($buyer, (string) ($args['to'] ?? ''), (string) ($args['subject'] ?? ''), (string) ($args['body'] ?? '')),
            'google_calendar_list_events' => $this->google->calendarListEvents($buyer, (int) ($args['limit'] ?? 10)),
            'google_drive_search' => $this->google->driveSearch($buyer, (string) ($args['query'] ?? ''), (int) ($args['limit'] ?? 10)),
            default => ['error' => "Unknown google tool: {$tool}"],
        };
    }

    // ── Jira ────────────────────────────────────────────────────────

    private function jiraToolSpecs(): array
    {
        return [
            ['name' => 'jira_search_issues', 'description' => "Search Jira issues with JQL. Examples: 'project = PROJ AND status = Open', 'assignee = currentUser() AND resolution = Unresolved', 'updated >= -7d ORDER BY updated DESC'. Returns key, summary, status, assignee, priority.", 'parameters' => [
                'type' => 'object',
                'properties' => [
                    'jql' => ['type' => 'string', 'description' => 'A JQL query string.'],
                    'limit' => ['type' => 'integer', 'description' => 'Max results (default 10, max 50).'],
                ],
                'required' => ['jql'],
            ]],
            ['name' => 'jira_get_issue', 'description' => 'Fetch a single Jira issue (summary, description, status, assignee, etc.) by its key (e.g. "PROJ-123").', 'parameters' => [
                'type' => 'object',
                'properties' => [
                    'key' => ['type' => 'string', 'description' => 'Issue key like "PROJ-123".'],
                ],
                'required' => ['key'],
            ]],
            ['name' => 'jira_create_issue', 'description' => 'Create a new Jira issue. Confirm intent before calling — this is a write action.', 'parameters' => [
                'type' => 'object',
                'properties' => [
                    'project_key' => ['type' => 'string', 'description' => 'Project key, e.g. "PROJ".'],
                    'summary' => ['type' => 'string'],
                    'description' => ['type' => 'string', 'description' => 'Plain text description (optional).'],
                    'issue_type' => ['type' => 'string', 'description' => 'Issue type name (default "Task").'],
                ],
                'required' => ['project_key', 'summary'],
            ]],
            ['name' => 'jira_add_comment', 'description' => 'Add a comment to an existing Jira issue.', 'parameters' => [
                'type' => 'object',
                'properties' => [
                    'key' => ['type' => 'string', 'description' => 'Issue key like "PROJ-123".'],
                    'body' => ['type' => 'string', 'description' => 'Plain-text comment.'],
                ],
                'required' => ['key', 'body'],
            ]],
        ];
    }

    private function executeJira($buyer, string $tool, array $args): array
    {
        return match ($tool) {
            'jira_search_issues' => $this->jira->search($buyer, (string) ($args['jql'] ?? ''), (int) ($args['limit'] ?? 10)),
            'jira_get_issue' => $this->jira->getIssue($buyer, (string) ($args['key'] ?? '')),
            'jira_create_issue' => $this->jira->createIssue($buyer, (string) ($args['project_key'] ?? ''), (string) ($args['summary'] ?? ''), $args['description'] ?? null, (string) ($args['issue_type'] ?? 'Task')),
            'jira_add_comment' => $this->jira->addComment($buyer, (string) ($args['key'] ?? ''), (string) ($args['body'] ?? '')),
            default => ['error' => "Unknown jira tool: {$tool}"],
        };
    }

    // ── HubSpot ─────────────────────────────────────────────────────

    private function hubspotToolSpecs(): array
    {
        return [
            ['name' => 'hubspot_search_contacts', 'description' => "Search the buyer's HubSpot CRM contacts by free-text query (name, email, company). Returns id + key contact properties.", 'parameters' => [
                'type' => 'object',
                'properties' => [
                    'query' => ['type' => 'string', 'description' => 'Free-text search (matches name, email, company).'],
                    'limit' => ['type' => 'integer', 'description' => 'Max results (default 10, max 50).'],
                ],
                'required' => ['query'],
            ]],
            ['name' => 'hubspot_get_contact', 'description' => 'Fetch a single HubSpot contact by id (returned by hubspot_search_contacts).', 'parameters' => [
                'type' => 'object',
                'properties' => [
                    'id' => ['type' => 'string', 'description' => 'HubSpot contact id.'],
                ],
                'required' => ['id'],
            ]],
            ['name' => 'hubspot_create_contact', 'description' => 'Create a new HubSpot contact. Confirm intent before calling — this writes to the buyer\'s CRM.', 'parameters' => [
                'type' => 'object',
                'properties' => [
                    'email' => ['type' => 'string', 'description' => 'Required. The contact\'s email — HubSpot uses it as the unique identifier.'],
                    'firstname' => ['type' => 'string'],
                    'lastname' => ['type' => 'string'],
                    'company' => ['type' => 'string'],
                    'jobtitle' => ['type' => 'string'],
                    'phone' => ['type' => 'string'],
                ],
                'required' => ['email'],
            ]],
            ['name' => 'hubspot_search_deals', 'description' => "Search the buyer's HubSpot deals (sales pipeline) by free-text query (deal name).", 'parameters' => [
                'type' => 'object',
                'properties' => [
                    'query' => ['type' => 'string', 'description' => 'Free-text deal-name search.'],
                    'limit' => ['type' => 'integer', 'description' => 'Max results (default 10, max 50).'],
                ],
                'required' => ['query'],
            ]],
            ['name' => 'hubspot_create_deal', 'description' => 'Create a new HubSpot deal in the buyer\'s default pipeline. Confirm intent first.', 'parameters' => [
                'type' => 'object',
                'properties' => [
                    'name' => ['type' => 'string', 'description' => 'Deal name (required).'],
                    'amount' => ['type' => 'string', 'description' => 'Deal amount as a number string (e.g. "1500").'],
                    'stage' => ['type' => 'string', 'description' => 'Pipeline stage internal id, e.g. "appointmentscheduled".'],
                ],
                'required' => ['name'],
            ]],
        ];
    }

    private function executeHubspot($buyer, string $tool, array $args): array
    {
        return match ($tool) {
            'hubspot_search_contacts' => $this->hubspot->searchContacts($buyer, (string) ($args['query'] ?? ''), (int) ($args['limit'] ?? 10)),
            'hubspot_get_contact' => $this->hubspot->getContact($buyer, (string) ($args['id'] ?? '')),
            'hubspot_create_contact' => $this->hubspot->createContact(
                $buyer,
                (string) ($args['email'] ?? ''),
                isset($args['firstname']) ? (string) $args['firstname'] : null,
                isset($args['lastname']) ? (string) $args['lastname'] : null,
                array_intersect_key($args, array_flip(['company', 'jobtitle', 'phone'])),
            ),
            'hubspot_search_deals' => $this->hubspot->searchDeals($buyer, (string) ($args['query'] ?? ''), (int) ($args['limit'] ?? 10)),
            'hubspot_create_deal' => $this->hubspot->createDeal(
                $buyer,
                (string) ($args['name'] ?? ''),
                isset($args['amount']) ? (string) $args['amount'] : null,
                isset($args['stage']) ? (string) $args['stage'] : null,
            ),
            default => ['error' => "Unknown hubspot tool: {$tool}"],
        };
    }

    // ── Provider tool-shape ─────────────────────────────────────────

    private function shape(string $provider, string $name, string $description, array $parameters): ?array
    {
        return match ($provider) {
            'anthropic' => ['name' => $name, 'description' => $description, 'input_schema' => $parameters],
            'openai', 'google' => ['type' => 'function', 'function' => ['name' => $name, 'description' => $description, 'parameters' => $parameters]],
            default => null,
        };
    }
}
