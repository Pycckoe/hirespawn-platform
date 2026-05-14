<?php

namespace App\Http\Middleware;

use App\Models\Menu;
use App\Models\SiteSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            'flash' => [
                'status' => fn () => $request->session()->get('status'),
                'apiKeySecret' => fn () => $request->session()->get('apiKeySecret'),
            ],
            // CMS content — menus + site copy. Cached for 60s so the admin
            // sees edits within a minute without slamming Postgres on every
            // navigation. Lazy: only resolved when a page asks for it.
            'cms' => fn () => Cache::remember('cms.shared', 60, fn () => [
                'menus' => Menu::allForRender(),
                'settings' => SiteSetting::all_keyed(),
            ]),
        ];
    }
}
