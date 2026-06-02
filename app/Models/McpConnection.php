<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Crypt;

class McpConnection extends Model
{
    protected $guarded = [];

    protected $casts = [
        'is_active' => 'boolean',
        'tool_count' => 'integer',
        'tools_cache' => 'array',
        'checked_at' => 'datetime',
    ];

    protected $hidden = ['encrypted_token'];

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }

    public function setToken(?string $plain): void
    {
        $this->encrypted_token = $plain ? Crypt::encryptString($plain) : null;
    }

    public function decryptedToken(): ?string
    {
        return $this->encrypted_token ? Crypt::decryptString($this->encrypted_token) : null;
    }
}
