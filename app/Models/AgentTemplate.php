<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AgentTemplate extends Model
{
    protected $guarded = [];

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    protected $casts = [
        'languages' => 'array',
        'integrations' => 'array',
        'skills' => 'array',
        'setting_defs' => 'array',
        'accepts_knowledge' => 'boolean',
        'is_active' => 'boolean',
        'power_cost' => 'integer',
        'est_input_tokens' => 'integer',
        'est_output_tokens' => 'integer',
        'sort_order' => 'integer',
    ];
}
