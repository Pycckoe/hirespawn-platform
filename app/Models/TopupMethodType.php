<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Admin-curated catalog of how buyers can top up their power balance.
 * Different providers / fees than the seller-side payout catalog.
 */
class TopupMethodType extends Model
{
    protected $guarded = [];

    protected $casts = [
        'is_active' => 'boolean',
        'fee_percent' => 'decimal:2',
    ];

    /**
     * Active top-up types in display order.
     *
     * @return array<int, array{key: string, label: string, icon: ?string, fee_percent: string, fee_flat_cents: int, min_amount_cents: int}>
     */
    public static function active(): array
    {
        return static::query()
            ->where('is_active', true)
            ->orderBy('sort')
            ->get(['key', 'label', 'icon', 'fee_percent', 'fee_flat_cents', 'min_amount_cents'])
            ->map(fn ($r) => $r->only(['key', 'label', 'icon', 'fee_percent', 'fee_flat_cents', 'min_amount_cents']))
            ->all();
    }

    /**
     * Compute the gateway fee in cents for a given gross amount.
     * fee = ceil(amount × fee_percent / 100) + fee_flat_cents
     */
    public function calculateFeeCents(int $amountCents): int
    {
        $pct = (int) ceil($amountCents * ((float) $this->fee_percent) / 100);

        return $pct + (int) $this->fee_flat_cents;
    }
}
