<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Agent extends Model
{
    protected $guarded = [];

    protected $casts = [
        'languages' => 'array',
        'integrations' => 'array',
        'is_featured' => 'boolean',
        'rating_avg' => 'float',
        'sla_uptime_pct' => 'float',
        'featured_until' => 'datetime',
        'published_at' => 'datetime',
    ];

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function seller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(AgentCategory::class, 'category_id');
    }

    public function llmModel(): BelongsTo
    {
        return $this->belongsTo(LlmModel::class, 'llm_model_id');
    }

    public function skills(): HasMany
    {
        return $this->hasMany(AgentSkill::class)->where('is_active', true)->orderBy('sort_order');
    }

    public function allSkills(): HasMany
    {
        return $this->hasMany(AgentSkill::class)->orderBy('sort_order');
    }

    public function capabilities(): HasMany
    {
        return $this->hasMany(AgentCapability::class);
    }

    public function pricingTiers(): HasMany
    {
        return $this->hasMany(AgentPricingTier::class)->orderBy('sort_order');
    }

    public function screenshots(): HasMany
    {
        return $this->hasMany(AgentScreenshot::class)->orderBy('sort_order');
    }

    public function tags(): HasMany
    {
        return $this->hasMany(AgentTag::class);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }
}
