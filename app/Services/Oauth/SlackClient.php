<?php

namespace App\Services\Oauth;

use App\Models\User;
use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * Thin Slack Web API client used to populate live pickers (channels)
 * in the buyer's agent-configuration UI. Calls are made with the
 * buyer's stored OAuth token — never a platform token.
 */
class SlackClient
{
    /**
     * List the public + private channels the buyer's connected Slack
     * token can see. Returns
     * ['ok' => bool, 'channels' => [...], 'error' => ?string, 'private_supported' => bool].
     *
     * Note: with a bot token + `channels:read` scope, conversations.list
     * returns ALL public channels whether or not the bot is a member.
     * PRIVATE channels are different: they need the `groups:read` scope AND
     * the bot must have been invited to the channel — Slack never lists a
     * private channel the bot isn't a member of.
     */
    public function listChannels(User $user): array
    {
        $token = $user->oauthTokenFor('slack');
        if (! $token) {
            return ['ok' => false, 'channels' => [], 'error' => 'not_connected', 'private_supported' => false];
        }

        $access = $token->freshAccessToken();
        if (! $access) {
            return ['ok' => false, 'channels' => [], 'error' => 'token_expired', 'private_supported' => false];
        }

        // Try to include private channels. private_channel needs the
        // `groups:read` bot scope; if the token lacks it Slack rejects the
        // WHOLE call with missing_scope, so we transparently retry with
        // public channels only. Probing Slack directly (rather than trusting
        // our stored scope list) means private channels light up the moment
        // the bot token actually carries groups:read — no matter how the
        // scopes were parsed at connect time.
        $result = $this->fetch($access, 'public_channel,private_channel');
        $privateSupported = $result['error'] !== 'missing_scope';
        if (! $privateSupported) {
            $result = $this->fetch($access, 'public_channel');
        }

        if ($result['error'] === null) {
            $token->forceFill(['last_used_at' => now()])->save();
        }

        return $result + ['private_supported' => $privateSupported];
    }

    /**
     * Page through conversations.list for the given comma-separated channel
     * types. Returns ['ok' => bool, 'channels' => [...], 'error' => ?string].
     */
    private function fetch(string $access, string $types): array
    {
        try {
            $channels = [];
            $cursor = null;
            $error = null;

            do {
                $resp = Http::withToken($access)
                    ->timeout(20)
                    ->get('https://slack.com/api/conversations.list', array_filter([
                        'types' => $types,
                        'exclude_archived' => 'true',
                        'limit' => 200,
                        'cursor' => $cursor,
                    ]));

                $json = $resp->json();
                if (! ($json['ok'] ?? false)) {
                    // Surface Slack's own error code (missing_scope,
                    // invalid_auth, account_inactive, …) for the UI.
                    $error = $json['error'] ?? 'slack_error';
                    break;
                }

                foreach ($json['channels'] ?? [] as $c) {
                    $channels[] = [
                        'id' => $c['id'],
                        'name' => '#'.$c['name'].(($c['is_private'] ?? false) ? ' (private)' : ''),
                    ];
                }

                $cursor = $json['response_metadata']['next_cursor'] ?? null;
            } while ($cursor && count($channels) < 1000);

            usort($channels, fn ($a, $b) => strcmp($a['name'], $b['name']));

            return ['ok' => $error === null, 'channels' => $channels, 'error' => $error];
        } catch (Throwable $e) {
            return ['ok' => false, 'channels' => [], 'error' => 'request_failed'];
        }
    }

    /**
     * Post a message to a channel with the user's bot token. $threadTs
     * replies in-thread when provided. Returns ['ok' => bool, 'error' => ?].
     */
    public function postMessage(User $user, string $channel, string $text, ?string $threadTs = null): array
    {
        $access = $user->oauthTokenFor('slack')?->freshAccessToken();
        if (! $access) {
            return ['ok' => false, 'error' => 'not_connected'];
        }

        try {
            $resp = Http::withToken($access)->timeout(20)->post('https://slack.com/api/chat.postMessage', array_filter([
                'channel' => $channel,
                'text' => self::toSlackMrkdwn($text),
                'thread_ts' => $threadTs,
            ]));
            $json = $resp->json();

            return ['ok' => (bool) ($json['ok'] ?? false), 'error' => $json['error'] ?? null];
        } catch (Throwable $e) {
            return ['ok' => false, 'error' => 'request_failed'];
        }
    }

    /**
     * Convert standard Markdown (what LLMs emit) into Slack's "mrkdwn"
     * so headers / bold / links / rules render correctly in the channel
     * instead of leaking syntax like "**bold**" or "## Heading".
     *
     * Slack mrkdwn cheatsheet:
     *   *bold*   _italic_   ~strike~   `code`   ```block```   <url|text>
     *   No headers, no horizontal rules — we just bold the heading text
     *   and drop "---" separators.
     */
    public static function toSlackMrkdwn(string $text): string
    {
        // Protect fenced code blocks (``` ... ```) from any other rewrites.
        $blocks = [];
        $text = preg_replace_callback('/```[\s\S]*?```/', function ($m) use (&$blocks) {
            $blocks[] = $m[0];

            return "\0CODE".(count($blocks) - 1)."\0";
        }, $text) ?? $text;

        // Headers (#, ##, ### …) → "*Heading*" on their own line.
        $text = preg_replace('/^[ \t]*#{1,6}[ \t]+(.+?)[ \t]*$/m', '*$1*', $text) ?? $text;
        // Horizontal rules (---, ***, ___) → blank line.
        $text = preg_replace('/^[ \t]*[-_*]{3,}[ \t]*$/m', '', $text) ?? $text;
        // Bold "**foo**" or "__foo__" → "*foo*".
        $text = preg_replace('/\*\*(.+?)\*\*/s', '*$1*', $text) ?? $text;
        $text = preg_replace('/__(.+?)__/s', '*$1*', $text) ?? $text;
        // Markdown links "[text](url)" → "<url|text>".
        $text = preg_replace('/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/', '<$2|$1>', $text) ?? $text;
        // Collapse 3+ blank lines (left over from stripped rules) to 2.
        $text = preg_replace("/\n{3,}/", "\n\n", $text) ?? $text;

        // Restore code blocks unchanged.
        foreach ($blocks as $i => $block) {
            $text = str_replace("\0CODE{$i}\0", $block, $text);
        }

        return trim($text);
    }

    /**
     * Has OUR bot already posted in this thread? Lets us answer follow-up
     * messages in the same thread without requiring another @mention.
     * Compares each reply's `user` against the buyer's stored bot_user_id.
     */
    public function threadHasBot(User $user, string $channelId, string $threadTs): bool
    {
        $token = $user->oauthTokenFor('slack');
        $botId = $token?->bot_user_id;
        if (! $botId) {
            return false;
        }
        $access = $token?->freshAccessToken();
        if (! $access) {
            return false;
        }

        try {
            $resp = Http::withToken($access)->timeout(15)->get('https://slack.com/api/conversations.replies', [
                'channel' => $channelId,
                'ts' => $threadTs,
                'limit' => 50,
            ]);
            $json = $resp->json();
            if (! ($json['ok'] ?? false)) {
                return false;
            }
            foreach ($json['messages'] ?? [] as $msg) {
                if (($msg['user'] ?? null) === $botId) {
                    return true;
                }
            }

            return false;
        } catch (Throwable $e) {
            return false;
        }
    }

    /**
     * Resolve a channel ID to its "#name" via conversations.info. Null on
     * failure. Used to match an inbound event's channel (an ID) against the
     * "#name" stored in a subscription's routing config.
     */
    public function channelName(User $user, string $channelId): ?string
    {
        $access = $user->oauthTokenFor('slack')?->freshAccessToken();
        if (! $access) {
            return null;
        }

        try {
            $resp = Http::withToken($access)->timeout(15)->get('https://slack.com/api/conversations.info', [
                'channel' => $channelId,
            ]);
            $json = $resp->json();
            if (! ($json['ok'] ?? false)) {
                return null;
            }
            $name = $json['channel']['name'] ?? null;

            return $name ? '#'.$name : null;
        } catch (Throwable $e) {
            return null;
        }
    }
}
