<?php

namespace App\Http\Controllers;

use App\Models\Page;
use App\Models\PowerPack;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class PageController extends Controller
{
    public function home(): Response
    {
        return Inertia::render('Home');
    }

    /**
     * Render a CMS markdown page at /p/{slug}.
     */
    public function showPage(string $slug): Response
    {
        $page = Page::query()
            ->where('slug', $slug)
            ->where('is_published', true)
            ->first();

        if (! $page) {
            throw new NotFoundHttpException();
        }

        return Inertia::render('CmsPage', [
            'page' => [
                'title' => $page->title,
                'metaTitle' => $page->meta_title,
                'metaDescription' => $page->meta_description,
                'bodyHtml' => $page->renderedBody(),
                'publishedAt' => $page->published_at?->format('M d, Y'),
                'updatedAt' => $page->updated_at?->format('M d, Y'),
            ],
        ]);
    }

    public function pricing(): Response
    {
        return Inertia::render('Pricing', [
            'powerPacks' => $this->powerPacks(),
        ]);
    }

    public function hire(): Response
    {
        return Inertia::render('Hire');
    }

    public function power(): Response
    {
        return Inertia::render('PowerCheckout', [
            'powerPacks' => $this->powerPacks(),
        ]);
    }

    private function powerPacks(): array
    {
        return PowerPack::query()
            ->orderBy('sort_order')
            ->get()
            ->map(fn (PowerPack $p) => [
                'name' => $p->name,
                'slug' => $p->slug,
                'power' => $p->power,
                'eur' => $p->price_cents !== null ? intdiv($p->price_cents, 100) : null,
                'perPower' => (float) $p->per_power_eur,
                'popular' => (bool) $p->is_popular,
                'audience' => $p->audience,
                'features' => $p->perks ?? [],
                'custom' => $p->price_cents === null,
            ])
            ->values()
            ->all();
    }

    public function about(): Response
    {
        return Inertia::render('About');
    }

    public function customers(): Response
    {
        return Inertia::render('Customers');
    }

    public function docs(): Response
    {
        return Inertia::render('Docs');
    }

    public function security(): Response
    {
        return Inertia::render('Security');
    }

    public function status(): Response
    {
        return Inertia::render('Status');
    }

    public function changelog(): Response
    {
        return Inertia::render('Changelog');
    }

    public function legal(): Response
    {
        return Inertia::render('Legal');
    }

    public function emails(): Response
    {
        return Inertia::render('Emails');
    }

    public function blogIndex(): Response
    {
        return Inertia::render('Blog/Index');
    }

    public function blogPost(string $slug): Response
    {
        return Inertia::render('Blog/Post', ['slug' => $slug]);
    }
}
