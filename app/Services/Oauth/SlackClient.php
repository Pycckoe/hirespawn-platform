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
     * token can see. Returns ['ok' => bool, 'channels' => [...], 'error' => ?string].
     *
     * Note: with a bot token + `channels:read` scope, conversations.list
     * returns ALL public channels whether or not the bot is a member —
     * membership only matters for POSTING. So an empty list almost always
     * means a missing scope, not "invite the bot".
     */
    public function listChannels(User $user): array
    {
        $token = $user->oauthTokenFor('slack');
        if (! $token) {
            return ['ok' => false, 'channels' => [], 'error' => 'not_connected'];
        }

        $access = $token->freshAccessToken();
        if (! $access) {
            return ['ok' => false, 'channels' => [], 'error' => 'token_expired'];
        }

        try {
            $channels = [];
            $cursor = null;
            $error = null;

            do {
                $resp = Http::withToken($access)
                    ->timeout(20)
                    ->get('https://slack.com/api/conversations.list', array_filter([
                        'types' => 'public_channel,private_channel',
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
                    $channels[] = ['id' => $c['id'], 'name' => '#'.$c['name']];
                }

                $cursor = $json['response_metadata']['next_cursor'] ?? null;
            } while ($cursor && count($channels) < 1000);

            usort($channels, fn ($a, $b) => strcmp($a['name'], $b['name']));
            $token->forceFill(['last_used_at' => now()])->save();

            return ['ok' => $error === null, 'channels' => $channels, 'error' => $error];
        } catch (Throwable $e) {
            return ['ok' => false, 'channels' => [], 'error' => 'request_failed'];
        }
    }
}
