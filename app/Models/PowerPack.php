<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PowerPack extends Model
{
    protected $guarded = [];

    protected $casts = [
        'perks' => 'array',
        'is_popular' => 'boolean',
        'per_power_eur' => 'float',
    ];
}
