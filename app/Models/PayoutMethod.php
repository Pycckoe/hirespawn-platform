<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PayoutMethod extends Model
{
    protected $guarded = [];

    protected $casts = [
        'details' => 'array',
        'is_default' => 'boolean',
        'verified_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Human label like "SEPA · DE89 ••• 7298" or "PayPal · ops@…"
     */
    public function display(): string
    {
        return match ($this->type) {
            'bank' => 'SEPA · '.($this->routing_hint ?? '').' ••• '.($this->account_last4 ?? '????'),
            'card' => 'Card · •••• '.($this->account_last4 ?? '????'),
            'paypal' => 'PayPal · '.($this->details['email_masked'] ?? '—'),
            'wise' => 'Wise · '.($this->currency ?? 'EUR').' acct ••• '.($this->account_last4 ?? '????'),
            'crypto' => 'Wallet · '.($this->routing_hint ?? '').' ••• '.($this->account_last4 ?? '????'),
            default => $this->label,
        };
    }
}
