<?php

namespace App\Services\Github;

use App\Models\OauthApp;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * GitHub App authentication. The App itself signs a short-lived RS256 JWT
 * (10 min max) and exchanges it for an installation access token (1h TTL)
 * per repo install. We cache the installation token so we don't ask GitHub
 * for one on every API call.
 *
 * Spec:
 *   https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app
 */
class GithubAppAuth
{
    public function __construct(
        private readonly string $appId,
        private readonly string $privateKeyPem,
    ) {}

    /**
     * Build the auth helper from the admin-managed OauthApp row, or null
     * when the GitHub App isn't fully configured yet. Callers degrade
     * gracefully (the webhook returns 503; the configure UI shows "not
     * configured").
     */
    public static function fromConfig(): ?self
    {
        $app = OauthApp::query()->where('provider', 'github')->first();
        if (! $app) {
            return null;
        }
        $key = $app->decryptedGithubPrivateKey();
        if ($app->github_app_id === null || $app->github_app_id === '' || $key === '') {
            return null;
        }

        return new self((string) $app->github_app_id, $key);
    }

    /**
     * Sign a short-lived JWT that identifies the GitHub App itself. Used
     * to call /app/installations/* endpoints. Signed with PHP's built-in
     * openssl_sign — no extra composer dep.
     */
    public function generateAppJwt(): string
    {
        $now = time();
        $header = ['typ' => 'JWT', 'alg' => 'RS256'];
        // 60s clock-skew buffer; 9 minute TTL (max allowed is 10).
        $payload = ['iat' => $now - 60, 'exp' => $now + 540, 'iss' => $this->appId];

        $b64 = fn (array $a) => rtrim(strtr(base64_encode((string) json_encode($a, JSON_UNESCAPED_SLASHES)), '+/', '-_'), '=');
        $signingInput = $b64($header).'.'.$b64($payload);

        $key = openssl_pkey_get_private($this->privateKeyPem);
        if ($key === false) {
            throw new RuntimeException('GitHub App private key is not a valid PEM.');
        }
        $signature = '';
        if (! openssl_sign($signingInput, $signature, $key, OPENSSL_ALGO_SHA256)) {
            throw new RuntimeException('Failed to sign GitHub App JWT.');
        }

        return $signingInput.'.'.rtrim(strtr(base64_encode($signature), '+/', '-_'), '=');
    }

    /**
     * Get an installation access token for a given installation_id, using
     * Cache to avoid hitting GitHub every call. Cached for 50 minutes
     * (token TTL is 60). Null when GitHub rejects the request.
     */
    public function installationToken(int $installationId): ?string
    {
        return Cache::remember("gh_install_token:{$installationId}", now()->addMinutes(50), function () use ($installationId) {
            try {
                $resp = Http::withToken($this->generateAppJwt())
                    ->withHeaders([
                        'Accept' => 'application/vnd.github+json',
                        'X-GitHub-Api-Version' => '2022-11-28',
                    ])
                    ->timeout(20)
                    ->post("https://api.github.com/app/installations/{$installationId}/access_tokens");

                return $resp->successful() ? $resp->json('token') : null;
            } catch (\Throwable) {
                return null;
            }
        });
    }
}
