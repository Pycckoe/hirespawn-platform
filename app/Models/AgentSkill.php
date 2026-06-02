<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AgentSkill extends Model
{
    protected $guarded = [];

    protected $casts = [
        'parameters_schema' => 'array',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
        'timeout_seconds' => 'integer',
    ];

    public function agent(): BelongsTo
    {
        return $this->belongsTo(Agent::class);
    }

    /**
     * Anthropic-shape tool definition. Spec:
     * https://docs.anthropic.com/en/docs/build-with-claude/tool-use
     */
    public function toAnthropicTool(): array
    {
        return [
            'name' => $this->name,
            'description' => $this->description,
            'input_schema' => $this->parameters_schema ?: ['type' => 'object', 'properties' => new \stdClass(), 'additionalProperties' => false],
        ];
    }

    /**
     * OpenAI-shape function tool definition.
     * https://platform.openai.com/docs/guides/function-calling
     */
    public function toOpenAiTool(): array
    {
        return [
            'type' => 'function',
            'function' => [
                'name' => $this->name,
                'description' => $this->description,
                'parameters' => $this->parameters_schema ?: ['type' => 'object', 'properties' => new \stdClass()],
            ],
        ];
    }
}
