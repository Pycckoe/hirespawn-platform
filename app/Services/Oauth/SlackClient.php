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
}
