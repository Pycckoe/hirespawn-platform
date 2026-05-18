<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LlmModel extends Model
{
    protected $guarded = [];

    protected $casts = [
        'capabilities' => 'array',
        'is_active' => 'boolean',
        'deprecated_at' => 'datetime',
        'input_price_cents_per_1m' => 'integer',
        'output_price_cents_per_1m' => 'integer',
        'context_window' => 'integer',
        'max_output_tokens' => 'integer',
        'sort_order' => 'integer',
    ];

    /**
     * Cost in € cents for a hypothetical run with the given input + output
     * token counts. Used by the publish form's margin calculator and by
     * the InvokeController after a real run finishes.
     */
    public function costCentsFor(int $inputTokens, int $outputTokens): int
    {
        $inCost = $inputTokens * $this->input_price_cents_per_1m / 1_000_000;
        $outCost = $outputTokens * $this->output_price_cents_per_1m / 1_000_000;

        return (int) ceil($inCost + $outCost);
    }
}
