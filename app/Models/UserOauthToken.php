<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class UserOauthToken extends Model
{
    protected $guarded = [];

    protected $casts = [
        'scopes' => 'array',
        'expires_at' => 'datetime',
        'last_used_at' => 'datetime',
    ];

    protected $hidden = ['encrypted_access_token', 'encrypted_refresh_token'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function decryptedAccessToken(): string
    {
        return Crypt::decryptString($this->encrypted_access_token);
    }

    public function decryptedRefreshToken(): ?string
    {
        return $this->encrypted_refresh_token
            ? Crypt::decryptString($this->encrypted_refresh_token)
            : null;
    }

    public function setAccessToken(string $plain): void
    {
        $this->encrypted_access_token = Crypt::encryptString($plain);
    }

    public function setRefreshToken(?string $plain): void
    {
        $this->encrypted_refresh_token = $plain ? Crypt::encryptString($plain) : null;
    }

    /** True when we know the token is past its TTL. */
    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isPast();
    }

    /**
     * Refresh the access token using the stored refresh_token. Reads
     * the OauthApp row for token_url + client credentials so the call
     * stays admin-configurable. Returns true on success, false if the
     * provider rejected the refresh (caller should then ask the user
     * to re-connect).
     */
    public function refreshAccessToken(): bool
    {
        $refresh = $this->decryptedRefreshToken();
        if (! $refresh) {
            return false;
        }

        $app = OauthApp::query()->where('provider', $this->provider)->first();
        if (! $app) {
            return false;
        }

        try {
            $resp = Http::asForm()
                ->timeout(30)
                ->post($app->token_url, [
                    'grant_type' => 'refresh_token',
                    'refresh_token' => $refresh,
                    'client_id' => $app->client_id,
                    'client_secret' => $app->decryptedClientSecret(),
                ]);

            if (! $resp->ok()) {
                Log::warning('OAuth refresh failed', [
                    'provider' => $this->provider,
                    'user_id' => $this->user_id,
                    'status' => $resp->status(),
                ]);

                return false;
            }

            $json = $resp->json();
            $access = $json['access_token'] ?? null;
            if (! $access) {
                return false;
            }

            $this->setAccessToken($access);
            // Some providers (Google) rotate refresh tokens; some (Slack)
            // don't return one and reuse the old. Update only if present.
            if (! empty($json['refresh_token'])) {
                $this->setRefreshToken($json['refresh_token']);
            }
            $expiresIn = (int) ($json['expires_in'] ?? 0);
            $this->expires_at = $expiresIn > 0 ? Carbon::now()->addSeconds($expiresIn) : null;
            $this->save();

            return true;
        } catch (\Throwable $e) {
            Log::error('OAuth refresh threw', [
                'provider' => $this->provider,
                'user_id' => $this->user_id,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Return a guaranteed-fresh access token (refreshing first if the
     * stored one is expired). Null if we can't refresh — caller should
     * fail the tool call with "please reconnect".
     */
    public function freshAccessToken(): ?string
    {
        if ($this->isExpired() && ! $this->refreshAccessToken()) {
            return null;
        }

        return $this->decryptedAccessToken();
    }
}
