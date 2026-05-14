<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SiteSetting extends Model
{
    protected $guarded = [];

    /**
     * Read a single setting by key. Falls back to $default if not present.
     */
    public static function value(string $key, ?string $default = null): ?string
    {
        return static::query()->where('key', $key)->value('value') ?? $default;
    }

    /**
     * Read all settings keyed by their `key` column. Cheap full-table scan —
     * the table only ever holds a few dozen rows.
     */
    public static function all_keyed(): array
    {
        return static::query()->pluck('value', 'key')->all();
    }

    protected static function booted(): void
    {
        $forget = fn () => \Illuminate\Support\Facades\Cache::forget('cms.shared');
        static::saved($forget);
        static::deleted($forget);
    }
}
