<?php

namespace App\Http\Controllers;

use App\Models\GithubInstallation;
use App\Services\Github\GithubAppAuth;
use App\Services\Github\GithubClient;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

/**
 * Lands the buyer after they install the GitHub App on their org/repos.
 * GitHub redirects to our Setup URL with ?installation_id=…&setup_action=
 * install. We attribute the installation to the logged-in buyer, sync the
 * repo list, then bounce them back to where they came from.
 */
class GithubAppController extends Controller
{
    public function setup(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user, 401);

        $installationId = (int) $request->query('installation_id');
        $setupAction = (string) $request->query('setup_action', 'install');
        $returnTo = $request->session()->pull('github_return', '/console');

        if ($installationId <= 0) {
            return redirect($returnTo)->with('status', 'GitHub installation could not be identified — try again.');
        }

        if ($setupAction === 'install' || $setupAction === 'update') {
            $auth = GithubAppAuth::fromConfig();
            if (! $auth) {
                return redirect($returnTo)->with('status', 'GitHub App is not configured yet. Ask an admin to fill App ID + Private Key in /admin/oauth-apps → GitHub.');
            }

            // Pull installation metadata + accessible repos using the App JWT.
            $jwt = $auth->generateAppJwt();
            $meta = Http::withToken($jwt)
                ->withHeaders(['Accept' => 'application/vnd.github+json', 'X-GitHub-Api-Version' => '2022-11-28'])
                ->timeout(20)
                ->get("https://api.github.com/app/installations/{$installationId}")
                ->json();

            $client = new GithubClient($auth);
            $reposResult = $client->listInstallationRepos($installationId);

            GithubInstallation::updateOrCreate(
                ['installation_id' => $installationId],
                [
                    'user_id' => $user->id,
                    'account_login' => $meta['account']['login'] ?? 'unknown',
                    'account_type' => $meta['account']['type'] ?? 'User',
                    'repos' => $reposResult['ok'] ? $reposResult['repos'] : [],
                    'last_synced_at' => now(),
                ],
            );

            audit('github.install', null, ['installation_id' => $installationId, 'account' => $meta['account']['login'] ?? null]);

            return redirect($returnTo)->with('status', '✓ GitHub App installed on '.($meta['account']['login'] ?? 'your account').'. Pick the repos this agent should listen to below.');
        }

        return redirect($returnTo)->with('status', "GitHub installation {$setupAction}d.");
    }

    /**
     * Kick off the install flow: stash the return URL, send the buyer to
     * the App's install page on github.com.
     */
    public function start(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user, 401);

        $request->session()->put('github_return', $request->query('return', '/console'));
        // The slug must match the App's URL slug; admin sets it via the
        // GitHub App settings on github.com. Until we have a UI for it,
        // read from oauth_apps row's `client_id` field — same place admins
        // pasted the OAuth client_id for other providers.
        $slug = \App\Models\OauthApp::query()->where('provider', 'github')->value('client_id');
        if (! $slug) {
            return back()->with('status', 'GitHub App slug not configured (paste it as Client ID in /admin/oauth-apps → GitHub).');
        }

        return redirect()->away("https://github.com/apps/{$slug}/installations/new");
    }
}
