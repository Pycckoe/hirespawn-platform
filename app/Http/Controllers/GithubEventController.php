<?php

namespace App\Http\Controllers;

use App\Jobs\HandleGithubEvent;
use App\Models\OauthApp;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * Inbound GitHub webhook endpoint. GitHub POSTs here for every event we
 * subscribed to in the App. Verifies the X-Hub-Signature-256 (HMAC-SHA256
 * of the raw body with the webhook secret), dedupes via X-GitHub-Delivery,
 * dispatches the work after the response so we ack <10s without a queue
 * worker.
 *
 * Configure once: GitHub App → General → Webhook URL = our /integrations/
 * github/events and Webhook Secret matches /admin/oauth-apps → GitHub.
 */
class GithubEventController extends Controller
{
    /** GET self-check so admins can verify the endpoint without GitHub. */
    public function status(): JsonResponse
    {
        $app = OauthApp::query()->where('provider', 'github')->first();
        $columnsPresent = Schema::hasColumn('oauth_apps', 'github_app_id')
            && Schema::hasColumn('oauth_apps', 'encrypted_github_private_key');

        $appIdSet = $columnsPresent && ! empty($app?->github_app_id);
        $keySet = $columnsPresent && ! empty($app?->encrypted_github_private_key);
        $secretSet = ! empty($app?->encrypted_signing_secret);

        return response()->json([
            'endpoint' => 'github events',
            'method_expected' => 'POST',
            'oauth_app_row_present' => $app !== null,
            'github_columns_present' => $columnsPresent,
            'app_id_configured' => $appIdSet,
            'private_key_configured' => $keySet,
            'webhook_secret_configured' => $secretSet,
            'ready' => $appIdSet && $keySet && $secretSet,
            'next_step' => match (true) {
                ! $columnsPresent => 'Run migrations.',
                ! $appIdSet || ! $keySet => 'Fill App ID + Private Key in /admin/oauth-apps → GitHub.',
                ! $secretSet => 'Paste the webhook secret in /admin/oauth-apps → GitHub (Signing secret field).',
                default => 'Ready. Set webhook URL + secret in the GitHub App and subscribe to events (pull_request, issues, issue_comment).',
            },
        ]);
    }

    public function __invoke(Request $request): Response|JsonResponse
    {
        $app = OauthApp::query()->where('provider', 'github')->first();
        $secret = $app?->decryptedSigningSecret() ?: '';
        if ($secret === '') {
            Log::warning('[github] inbound event but no webhook secret configured');

            return response('webhook secret not configured', 503);
        }

        if (! $this->verifySignature($request, $secret)) {
            Log::warning('[github] signature mismatch');

            return response('invalid signature', 403);
        }

        $event = (string) $request->header('X-GitHub-Event', '');
        $delivery = (string) $request->header('X-GitHub-Delivery', '');
        $payload = $request->json()->all();

        // Ping events fire on App save / webhook setup — handy ack so the
        // UI shows green next to our webhook.
        if ($event === 'ping') {
            return response()->json(['pong' => true]);
        }

        $installationId = (int) ($payload['installation']['id'] ?? 0);
        $action = (string) ($payload['action'] ?? '');
        $repo = (string) ($payload['repository']['full_name'] ?? '');

        Log::info('[github] event_received', compact('event', 'action', 'repo', 'installationId', 'delivery'));

        // Dedup by GitHub's delivery uuid (GitHub redelivers on receive timeouts).
        if ($delivery !== '' && ! Cache::add("gh_delivery:{$delivery}", 1, now()->addMinutes(10))) {
            return response('', 200);
        }

        if ($installationId > 0) {
            HandleGithubEvent::dispatchAfterResponse(
                installationId: $installationId,
                event: $event,
                action: $action,
                payload: $payload,
            );
        }

        return response('', 200);
    }

    /**
     * Verify "sha256=…" header against HMAC of the raw body. Constant-time
     * compare so we don't leak the secret length through timing.
     */
    private function verifySignature(Request $request, string $secret): bool
    {
        $header = (string) $request->header('X-Hub-Signature-256', '');
        if (! str_starts_with($header, 'sha256=')) {
            return false;
        }
        $expected = 'sha256='.hash_hmac('sha256', $request->getContent(), $secret);

        return hash_equals($expected, $header);
    }
}
