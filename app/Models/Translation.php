<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Translation extends Model
{
    protected $guarded = [];

    protected static function booted(): void
    {
        $forget = function (Translation $row) {
            Cache::forget("translations.{$row->locale}");
            Cache::forget('translations.locales');
        };
        static::saved($forget);
        static::deleted($forget);
    }

    public static function forLocale(string $locale): array
    {
        return Cache::remember("translations.{$locale}", 60, function () use ($locale) {
            return self::query()
                ->where('locale', $locale)
                ->get(['namespace', 'key', 'value'])
                ->mapWithKeys(fn ($row) => ["{$row->namespace}.{$row->key}" => $row->value])
                ->all();
        });
    }

    public static function availableLocales(): array
    {
        return Cache::remember('translations.locales', 300, function () {
            return self::query()
                ->select('locale')
                ->distinct()
                ->orderBy('locale')
                ->pluck('locale')
                ->all();
        });
    }
}
