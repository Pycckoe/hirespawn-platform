<?php

namespace App\Http\Controllers;

use App\Models\OauthApp;
use App\Models\UserOauthToken;
use App\Services\Oauth\SlackClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

/**
 * Generic OAuth2 authorization-code flow for letting buyers grant the
 * platform access to their third-party accounts (Slack, GitHub, HubSpot,
 * etc). The actual client_id/secret per provider lives in oauth_apps
 * and is managed by an admin at /admin/oauth-apps.
 *
 * Endpoints:
 *   GET  /oauth/{provider}/connect   → redirect to provider's authorize_url
 *   GET  /oauth/{provider}/callback  → exchange code → save UserOauthToken
 *   DEL  /oauth/{provider}           → revoke + drop the token row
 */
class OauthController extends Controller
{
    /**
     * Kick off the OAuth dance. Generates a CSRF `state` token in the
     * session and redirects the buyer to the provider's authorize page.
     */
    public function start(Request $request, string $provider): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user, 401);

        $returnTo = $request->query('return', '/console');

        // Find the provider regardless of active flag so we can give a
        // clear message instead of a raw 404 when it's disabled / unconfigured.
        $app = OauthApp::query()->where('provider', $provider)->first();
        if (! $app) {
            return redirect($returnTo)->with('status', "Unknown integration: {$provider}.");
        }
        if (! $app->is_active) {
            return redirect($returnTo)->with('status', "{$app->label} is disabled. An admin can enable it at /admin/oauth-apps.");
        }
        if (! $app->isConfigured()) {
            return redirect($returnTo)->with('status', "{$app->label} is not yet configured. Ask an admin to add a client_id + client_secret at /admin/oauth-apps.");
        }

        $state = Str::random(40);
        $request->session()->put("oauth_state.{$provider}", $state);
        // Where to bounce back to after success — defaults to /console.
        $request->session()->put("oauth_return.{$provider}", $returnTo);

        $params = [
            'client_id' => $app->client_id,
            'redirect_uri' => $this->redirectUri($provider),
            'response_type' => 'code',
            'scope' => implode(' ', $app->default_scopes ?? []),
            'state' => $state,
        ];

        $url = $app->authorize_url.(str_contains($app->authorize_url, '?') ? '&' : '?').http_build_query($params);

        return redirect()->away($url);
    }

    /**
     * The provider sent us back with ?code=&state=. Verify state,
     * exchange the code for tokens, store encrypted, redirect.
     */
    public function callback(Request $request, string $provider): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user, 401);

        $app = OauthApp::query()->where('provider', $provider)->where('is_active', true)->firstOrFail();

        $sessionState = $request->session()->pull("oauth_state.{$provider}");
        $returnTo = $request->session()->pull("oauth_return.{$provider}", '/console');

        if (! $sessionState || $sessionState !== $request->query('state')) {
            return redirect($returnTo)->with('status', "OAuth state mismatch for {$provider}. Try again.");
        }

        if ($error = $request->query('error')) {
            $desc = $request->query('error_description', '');
            return redirect($returnTo)->with('status', "✗ {$provider} OAuth denied: {$error} {$desc}");
        }

        $code = (string) $request->query('code');
        if (! $code) {
            return redirect($returnTo)->with('status', "No code returned from {$provider}.");
        }

        $resp = Http::asForm()
            ->timeout(30)
            ->post($app->token_url, [
                'grant_type' => 'authorization_code',
                'code' => $code,
                'redirect_uri' => $this->redirectUri($provider),
                'client_id' => $app->client_id,
                'client_secret' => $app->decryptedClientSecret(),
            ]);

        if (! $resp->ok()) {
            return redirect($returnTo)->with('status', "✗ {$provider} token exchange failed: HTTP {$resp->status()}");
        }

        $json = $resp->json();

        // Slack returns HTTP 200 with {ok:false, error:"..."} on failure
        // (invalid_code, bad_redirect_uri, …). Surface it instead of
        // silently storing a null token.
        if (array_key_exists('ok', $json) && $json['ok'] === false) {
            return redirect($returnTo)->with('status', "✗ {$provider}: ".($json['error'] ?? 'authorization failed').'.');
        }

        $access = $json['access_token'] ?? null;
        if (! $access) {
            return redirect($returnTo)->with('status', "✗ {$provider} returned no access token.");
        }

        $expiresIn = (int) ($json['expires_in'] ?? 0);
        $scopes = isset($json['scope'])
            ? array_filter(preg_split('/[\s,]+/', $json['scope']))
            : ($app->default_scopes ?? []);

        $token = UserOauthToken::firstOrNew(['user_id' => $user->id, 'provider' => $provider]);
        $token->setAccessToken($access);
        if (! empty($json['refresh_token'])) {
            $token->setRefreshToken($json['refresh_token']);
        }
        $token->scopes = array_values($scopes);
        $token->expires_at = $expiresIn > 0 ? Carbon::now()->addSeconds($expiresIn) : null;
        // Friendly label — prefer a human name (team / email / login)
        // over a raw user id. Slack v2 nests the workspace under `team`.
        $token->account_label = $json['team']['name']
            ?? $json['user']['email']
            ?? $json['user']['login']
            ?? $json['authed_user']['id']
            ?? $json['account_id']
            ?? null;
        $token->account_id = $json['team']['id']
            ?? $json['authed_user']['id']
            ?? $json['user']['id']
            ?? null;
        $token->save();

        audit('oauth.connect', $token, [
            'provider' => $provider,
            'account_label' => $token->account_label,
            'scopes' => $token->scopes,
        ]);

        return redirect($returnTo)->with('status', "✓ Connected {$app->label}".($token->account_label ? " ({$token->account_label})" : '').'.');
    }

    /**
     * Drop the OAuth token row. Note: we don't call the provider's
     * /revoke endpoint here — that's provider-specific work that lands
     * in v3 with the rest of the integration polish.
     */
    public function disconnect(Request $request, string $provider): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user, 401);

        $token = $user->oauthTokenFor($provider);
        if ($token) {
            $token->delete();
        }
        audit('oauth.disconnect', null, ['provider' => $provider]);

        return back()->with('status', "Disconnected {$provider}.");
    }

    /**
     * Live resource picker — returns the buyer's Slack channels so the
     * agent-configure UI can render a dropdown instead of asking them
     * to type a channel name by hand. Returns [] (+ connected:false)
     * if Slack isn't connected.
     */
    public function slackChannels(Request $request, SlackClient $slack): JsonResponse
    {
        $user = $request->user();
        abort_unless($user, 401);

        if (! $user->oauthTokenFor('slack')) {
            return response()->json(['connected' => false, 'channels' => [], 'error' => null, 'private_supported' => false]);
        }

        $result = $slack->listChannels($user);

        return response()->json([
            'connected' => true,
            'channels' => $result['channels'],
            'error' => $result['error'],
            'private_supported' => $result['private_supported'] ?? false,
        ]);
    }

    private function redirectUri(string $provider): string
    {
        return url("/oauth/{$provider}/callback");
    }
}
