<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentMethodType extends Model
{
    protected $guarded = [];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Active types available to either side. $audience IN ('buyer','seller').
     *
     * @return array<int, array{key: string, label: string, icon: ?string}>
     */
    public static function forAudience(string $audience): array
    {
        return static::query()
            ->where('is_active', true)
            ->whereIn('audience', [$audience, 'both'])
            ->orderBy('sort')
            ->get(['key', 'label', 'icon'])
            ->map(fn ($r) => $r->only(['key', 'label', 'icon']))
            ->all();
    }
}
