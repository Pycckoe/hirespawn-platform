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
            Log::info('[slack] event_callback', ['event_type' => $event['type'] ?? null, 'bot' => ! empty($event['bot_id'])]);

            // Only react to humans @-mentioning the bot. Ignore the bot's own
            // posts / bot messages to avoid loops.
            if (($event['type'] ?? null) === 'app_mention' && empty($event['bot_id'])) {
                // Dedup: Slack retries on timeout (X-Slack-Retry-Num). Cache::add
                // is atomic, so only the first delivery of an event_id proceeds.
                $eventId = $payload['event_id'] ?? md5(json_encode($event));
                if (Cache::add("slack_evt:{$eventId}", 1, now()->addMinutes(10))) {
                    // After-response so we ack Slack within 3s, then run the
                    // LLM + reply in the same process (no queue worker needed).
                    HandleSlackMention::dispatchAfterResponse(
                        teamId: $payload['team_id'] ?? ($event['team'] ?? ''),
                        channelId: $event['channel'] ?? '',
                        text: $event['text'] ?? '',
                        threadTs: $event['thread_ts'] ?? ($event['ts'] ?? null),
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
