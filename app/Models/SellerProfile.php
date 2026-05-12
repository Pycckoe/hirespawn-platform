<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SellerProfile extends Model
{
    protected $guarded = [];

    protected $casts = [
        'kyc_verified_at' => 'datetime',
        'rating_avg' => 'float',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
