<?php

namespace App\Http\Controllers;

use App\Jobs\HandleSlackMention;
use App\Models\OauthApp;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Inbound Slack Events API endpoint. Slack POSTs here when the bot is
 * mentioned in a channel the buyer connected. We verify the request
 * signature, answer the one-time url_verification handshake, then queue
 * the heavy work (LLM run + reply) and return 200 fast so Slack doesn't
 * retry.
 *
 * Configure in the Slack app → Event Subscriptions:
 *   Request URL: https://<host>/integrations/slack/events
 *   Subscribe to bot event: app_mention   (scope: app_mentions:read)
 */
class SlackEventController extends Controller
{
    /**
     * Tiny self-check available on GET. Hitting the URL in a browser tells
     * you whether the column/migration is live and whether the signing
     * secret has been pasted yet, without Slack being involved.
     */
    public function status(): JsonResponse
    {
        $app = OauthApp::query()->where('provider', 'slack')->first();
        $hasColumn = $app !== null && \Illuminate\Support\Facades\Schema::hasColumn('oauth_apps', 'encrypted_signing_secret');
        $signingSet = $hasColumn && ! empty($app?->encrypted_signing_secret);

        return response()->json([
            'endpoint' => 'slack events',
            'method_expected' => 'POST',
            'oauth_app_row_present' => $app !== null,
            'signing_secret_column_present' => $hasColumn,
            'signing_secret_configured' => $signingSet,
            'next_step' => $signingSet
                ? 'Ready. Paste the URL into Slack → Event Subscriptions and Save.'
                : 'Paste the Slack app Signing Secret in /admin/oauth-apps → Slack, then verify in Slack.',
        ]);
    }

    public function __invoke(Request $request): Response|JsonResponse
    {
        $app = OauthApp::query()->where('provider', 'slack')->first();
        $signingSecret = $app?->decryptedSigningSecret() ?: '';

        if ($signingSecret === '') {
            Log::warning('[slack] inbound event but no signing secret set in /admin/oauth-apps → Slack');

            return response('signing secret not configured', 403);
        }
        if (! $this->verifySignature($request, $signingSecret)) {
            Log::warning('[slack] inbound event signature mismatch (wrong signing secret?)');

            return response('invalid signature', 403);
        }

        $payload = $request->json()->all();
        $type = $payload['type'] ?? null;

        // One-time endpoint verification when you save the Request URL.
        if ($type === 'url_verification') {
            return response()->json(['challenge' => $payload['challenge'] ?? '']);
        }

        if ($type === 'event_callback') {
            $event = $payload['event'] ?? [];
            $evtType = $event['type'] ?? null;
            Log::info('[slack] event_callback', ['event_type' => $evtType, 'channel_type' => $event['channel_type'] ?? null, 'bot' => ! empty($event['bot_id']), 'thread_ts' => $event['thread_ts'] ?? null]);

            // Ignore the bot's own posts / other bots' messages — prevents
            // reply loops when our chat.postMessage triggers a message event.
            if (! empty($event['bot_id']) || ! empty($event['bot_profile'])) {
                return response('', 200);
            }

            // Decide whether we should respond.
            //  - app_mention      → always (someone tagged the bot).
            //  - message in DM    → always (1:1 chat with the bot).
            //  - message in thread→ only if the bot has already participated
            //                       (we check from the job to keep the ack fast).
            $isMention = $evtType === 'app_mention';
            $isDm = $evtType === 'message' && ($event['channel_type'] ?? null) === 'im';
            $isThreadReply = $evtType === 'message'
                && ! empty($event['thread_ts'])
                && ($event['thread_ts'] !== ($event['ts'] ?? null))
                && empty($event['subtype']); // skip joins/edits/etc.

            if ($isMention || $isDm || $isThreadReply) {
                // Dedup by message ts: when a user @-mentions the bot, Slack
                // delivers BOTH `app_mention` and `message.channels` with the
                // same ts. First-wins keeps us from replying twice.
                $key = ($event['channel'] ?? '').':'.($event['ts'] ?? '');
                if ($key !== ':' && Cache::add("slack_msg:{$key}", 1, now()->addMinutes(10))) {
                    HandleSlackMention::dispatchAfterResponse(
                        teamId: $payload['team_id'] ?? ($event['team'] ?? ''),
                        channelId: $event['channel'] ?? '',
                        text: $event['text'] ?? '',
                        threadTs: $event['thread_ts'] ?? ($event['ts'] ?? null),
                        isDirect: $isDm || $isMention, // skip thread-participation check
                    );
                }
            }
        }

        // Always 200 quickly — work happens on the queue.
        return response('', 200);
    }

    /**
     * Verify Slack's v0 request signature:
     *   base = "v0:{timestamp}:{rawBody}"
     *   expected = "v0=" . hmac_sha256(base, signingSecret)
     * Reject stale timestamps (>5 min) to block replays.
     */
    private function verifySignature(Request $request, string $secret): bool
    {
        $timestamp = (string) $request->header('X-Slack-Request-Timestamp', '');
        $signature = (string) $request->header('X-Slack-Signature', '');
        if ($timestamp === '' || $signature === '') {
            return false;
        }
        if (abs(time() - (int) $timestamp) > 300) {
            return false;
        }

        $base = 'v0:'.$timestamp.':'.$request->getContent();
        $expected = 'v0='.hash_hmac('sha256', $base, $secret);

        return hash_equals($expected, $signature);
    }
}
