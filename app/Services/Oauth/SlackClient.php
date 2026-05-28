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
     * token can see. Returns [{id, name}] sorted by name. Empty array
     * on any failure (caller renders an empty dropdown + hint).
     *
     * @return array<int, array{id: string, name: string}>
     */
    public function listChannels(User $user): array
    {
        $token = $user->oauthTokenFor('slack');
        if (! $token) {
            return [];
        }

        $access = $token->freshAccessToken();
        if (! $access) {
            return [];
        }

        try {
            $channels = [];
            $cursor = null;

            // conversations.list paginates; pull up to ~1000 channels.
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
                    break;
                }

                foreach ($json['channels'] ?? [] as $c) {
                    $channels[] = ['id' => $c['id'], 'name' => '#'.$c['name']];
                }

                $cursor = $json['response_metadata']['next_cursor'] ?? null;
            } while ($cursor && count($channels) < 1000);

            usort($channels, fn ($a, $b) => strcmp($a['name'], $b['name']));

            $token->forceFill(['last_used_at' => now()])->save();

            return $channels;
        } catch (Throwable) {
            return [];
        }
    }
}
