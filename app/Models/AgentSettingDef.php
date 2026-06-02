<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AgentSettingDef extends Model
{
    protected $guarded = [];

    protected $casts = [
        'options' => 'array',
        'is_required' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function agent(): BelongsTo
    {
        return $this->belongsTo(Agent::class);
    }

    /**
     * Coerce a raw input value (always string from a form) to the JS
     * shape the LLM template expects — booleans as "true"/"false",
     * numbers as numbers, multi-line text untouched.
     */
    public function coerce(mixed $raw): mixed
    {
        if ($raw === null || $raw === '') {
            return $this->default_value;
        }

        return match ($this->type) {
            'boolean' => filter_var($raw, FILTER_VALIDATE_BOOLEAN),
            'number' => is_numeric($raw) ? (float) $raw : $raw,
            default => (string) $raw,
        };
    }
}
