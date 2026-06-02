<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class OauthApp extends Model
{
    protected $guarded = [];

    protected $casts = [
        'default_scopes' => 'array',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    protected $hidden = ['encrypted_client_secret', 'encrypted_signing_secret', 'encrypted_github_private_key'];

    public function decryptedClientSecret(): string
    {
        // Empty string means admin hasn't filled the secret yet — return
        // a blank instead of throwing so the OAuth flow can surface a
        // clean "provider misconfigured" error to the buyer.
        if (! $this->encrypted_client_secret) {
            return '';
        }

        return Crypt::decryptString($this->encrypted_client_secret);
    }

    /** Signing secret for verifying inbound events (Slack/GitHub). '' if unset. */
    public function decryptedSigningSecret(): string
    {
        if (! $this->encrypted_signing_secret) {
            return '';
        }

        return Crypt::decryptString($this->encrypted_signing_secret);
    }

    public function setSigningSecret(?string $plain): void
    {
        $this->encrypted_signing_secret = $plain ? Crypt::encryptString(trim($plain)) : null;
    }

    /** GitHub App's RSA private key (PEM). '' if unset. */
    public function decryptedGithubPrivateKey(): string
    {
        if (! $this->encrypted_github_private_key) {
            return '';
        }

        return Crypt::decryptString($this->encrypted_github_private_key);
    }

    /** Whether the admin has filled in real credentials. */
    public function isConfigured(): bool
    {
        return ! empty($this->client_id) && ! empty($this->encrypted_client_secret);
    }

    public function setClientSecret(string $plain): void
    {
        $this->encrypted_client_secret = Crypt::encryptString(trim($plain));
    }
}
