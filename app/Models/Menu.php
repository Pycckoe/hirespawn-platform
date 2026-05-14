<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Menu extends Model
{
    protected $guarded = [];

    public function items(): HasMany
    {
        return $this->hasMany(MenuItem::class)->orderBy('sort');
    }

    /**
     * Bust the Inertia shared cache whenever a menu changes in /admin.
     */
    protected static function booted(): void
    {
        $forget = fn () => \Illuminate\Support\Facades\Cache::forget('cms.shared');
        static::saved($forget);
        static::deleted($forget);
    }

    /**
     * Return ALL menus keyed by their `key`, each as an array of active
     * items ready for JSON-encoding into Inertia props.
     *
     * @return array<string, array<int, array{label: string, url: ?string, icon: ?string, target: string}>>
     */
    public static function allForRender(): array
    {
        return static::query()
            ->with(['items' => fn ($q) => $q->where('is_active', true)->orderBy('sort')])
            ->get()
            ->mapWithKeys(fn ($menu) => [
                $menu->key => $menu->items->map(fn ($i) => [
                    'label' => $i->label,
                    'url' => $i->url,
                    'icon' => $i->icon,
                    'target' => $i->target,
                ])->all(),
            ])
            ->all();
    }
}
