<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;

class SellerLlmCredential extends Model
{
    protected $guarded = [];

    protected $casts = [
        'verified_at' => 'datetime',
        'last_used_at' => 'datetime',
    ];

    protected $hidden = ['encrypted_api_key'];

    public function seller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    /**
     * Decrypt the API key for use in an outbound request. Throws if the
     * key has been corrupted or APP_KEY has rotated without re-encryption.
     */
    public function decryptedKey(): string
    {
        return Crypt::decryptString($this->encrypted_api_key);
    }

    /**
     * Store a fresh key — encrypts it and records the last-4 for UI display.
     * Use this instead of writing to encrypted_api_key directly.
     */
    public function setKey(string $plain): void
    {
        $plain = trim($plain);
        $this->encrypted_api_key = Crypt::encryptString($plain);
        $this->last4 = Str::substr($plain, -4);
    }
}
