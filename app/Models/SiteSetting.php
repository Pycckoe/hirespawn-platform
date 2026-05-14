<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class SiteSetting extends Model
{
    protected $guarded = [];

    /**
     * Read a single setting by key. Falls back to $default if not present.
     * For image-type settings, returns the public storage URL.
     */
    public static function value(string $key, ?string $default = null): ?string
    {
        $row = static::query()->where('key', $key)->first(['value', 'type']);
        if (! $row) {
            return $default;
        }

        return self::transformValue($row->value, $row->type) ?? $default;
    }

    /**
     * Read all settings keyed by their `key` column. Cheap full-table scan —
     * the table only ever holds a few dozen rows. Image-type values are
     * returned as public URLs so the frontend can use them directly.
     */
    public static function all_keyed(): array
    {
        return static::query()
            ->get(['key', 'value', 'type'])
            ->mapWithKeys(fn ($s) => [$s->key => self::transformValue($s->value, $s->type)])
            ->all();
    }

    private static function transformValue(?string $value, ?string $type): ?string
    {
        if ($value === null || $value === '') {
            return $value;
        }
        if ($type === 'image') {
            // Storage path → public URL. Pass-through if already absolute.
            if (str_starts_with($value, 'http://') || str_starts_with($value, 'https://') || str_starts_with($value, '/')) {
                return $value;
            }

            return Storage::disk('public')->url($value);
        }

        return $value;
    }

    protected static function booted(): void
    {
        $forget = fn () => Cache::forget('cms.shared');
        static::saved($forget);
        static::deleted($forget);
    }
}
