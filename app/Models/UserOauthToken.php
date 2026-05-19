<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Crypt;

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
}
