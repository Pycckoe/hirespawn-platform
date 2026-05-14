<?php

use App\Models\Translation;
use Illuminate\Support\Facades\App;

if (! function_exists('t')) {
    /**
     * Look up a translation by "namespace.key" or just "key" (defaults to
     * the "site" namespace). Falls back to $default if no row exists for
     * the current request locale. Used by Blade + controllers; the JS
     * side reads the same map via Inertia shared props.
     */
    function t(string $key, ?string $default = null, ?string $locale = null): string
    {
        if (! str_contains($key, '.')) {
            $key = "site.{$key}";
        }
        [$namespace, $shortKey] = explode('.', $key, 2);

        $locale ??= App::getLocale();
        $map = Translation::forLocale($locale);

        return $map["{$namespace}.{$shortKey}"] ?? ($default ?? $shortKey);
    }
}
