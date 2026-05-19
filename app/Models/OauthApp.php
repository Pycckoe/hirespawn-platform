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

    protected $hidden = ['encrypted_client_secret'];

    public function decryptedClientSecret(): string
    {
        return Crypt::decryptString($this->encrypted_client_secret);
    }

    public function setClientSecret(string $plain): void
    {
        $this->encrypted_client_secret = Crypt::encryptString(trim($plain));
    }
}
