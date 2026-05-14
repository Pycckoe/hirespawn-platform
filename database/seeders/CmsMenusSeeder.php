<?php

namespace Database\Seeders;

use App\Models\Menu;
use App\Models\MenuItem;
use App\Models\Page;
use Illuminate\Database\Seeder;

class CmsMenusSeeder extends Seeder
{
    public function run(): void
    {
        // ---- Menus ----
        $menus = [
            ['key' => 'header_main',          'label' => 'Header · main nav',          'location' => 'header',        'sort' => 1, 'items' => [
                ['label' => 'Roster',     'url' => '/roster'],
                ['label' => 'Power',      'url' => '/power'],
                ['label' => 'Pricing',    'url' => '/pricing'],
                ['label' => 'Docs',       'url' => '/docs'],
                ['label' => 'Customers',  'url' => '/customers'],
                ['label' => 'About',      'url' => '/about'],
            ]],
            ['key' => 'footer_marketplace',   'label' => 'Footer · Marketplace column','location' => 'footer',        'sort' => 1, 'items' => [
                ['label' => 'Roster',          'url' => '/roster'],
                ['label' => 'New arrivals',    'url' => '/roster?sort=new'],
                ['label' => 'Top performers',  'url' => '/roster?sort=top'],
                ['label' => 'By category',     'url' => '/roster'],
                ['label' => 'By integration',  'url' => '/roster'],
            ]],
            ['key' => 'footer_power',         'label' => 'Footer · Power column',      'location' => 'footer',        'sort' => 2, 'items' => [
                ['label' => 'Buy Power',       'url' => '/power'],
                ['label' => 'Calculator',      'url' => '/pricing'],
                ['label' => 'Volume pricing',  'url' => '/pricing'],
                ['label' => 'Refund policy',   'url' => '/p/refunds'],
                ['label' => 'Rate cards',      'url' => '/pricing'],
            ]],
            ['key' => 'footer_sellers',       'label' => 'Footer · Sellers column',    'location' => 'footer',        'sort' => 3, 'items' => [
                ['label' => 'Apply',           'url' => '/hire'],
                ['label' => 'Manifest spec',   'url' => '/docs'],
                ['label' => 'Revenue share',   'url' => '/p/revenue-share'],
                ['label' => 'Seller console',  'url' => '/vendor'],
                ['label' => 'Disputes',        'url' => '/p/disputes'],
            ]],
            ['key' => 'footer_resources',     'label' => 'Footer · Resources column',  'location' => 'footer',        'sort' => 4, 'items' => [
                ['label' => 'Docs',            'url' => '/docs'],
                ['label' => 'API reference',   'url' => '/docs'],
                ['label' => 'Changelog',       'url' => '/changelog'],
                ['label' => 'Status',          'url' => '/status'],
                ['label' => 'Blog',            'url' => '/blog'],
            ]],
            ['key' => 'footer_company',       'label' => 'Footer · Company column',    'location' => 'footer',        'sort' => 5, 'items' => [
                ['label' => 'Manifesto',       'url' => '/about'],
                ['label' => 'Customers',       'url' => '/customers'],
                ['label' => 'Security',        'url' => '/security'],
                ['label' => 'DPA',             'url' => '/p/dpa'],
                ['label' => 'Contact',         'url' => 'mailto:support@hirespawn.com'],
            ]],
            ['key' => 'footer_legal',         'label' => 'Footer · Legal links',       'location' => 'footer_bottom', 'sort' => 6, 'items' => [
                ['label' => 'Terms',           'url' => '/p/terms'],
                ['label' => 'Privacy',         'url' => '/p/privacy'],
                ['label' => 'DPA',             'url' => '/p/dpa'],
                ['label' => 'AUP',             'url' => '/p/aup'],
                ['label' => 'Cookies',         'url' => '/p/cookies'],
                ['label' => 'Subprocessors',   'url' => '/p/subprocessors'],
            ]],
            ['key' => 'footer_social',        'label' => 'Footer · Social icons',      'location' => 'social',        'sort' => 7, 'items' => [
                ['label' => 'X / Twitter', 'icon' => 'x',        'url' => 'https://x.com/hirespawn',         'target' => '_blank'],
                ['label' => 'LinkedIn',    'icon' => 'linkedin', 'url' => 'https://linkedin.com/company/hirespawn', 'target' => '_blank'],
                ['label' => 'GitHub',      'icon' => 'github',   'url' => 'https://github.com/hirespawn',    'target' => '_blank'],
                ['label' => 'YouTube',     'icon' => 'youtube',  'url' => 'https://youtube.com/@hirespawn',  'target' => '_blank'],
                ['label' => 'RSS',         'icon' => 'rss',      'url' => '/feed.xml',                       'target' => '_blank'],
            ]],
            ['key' => 'footer_payments',      'label' => 'Footer · Payment logos',     'location' => 'payments',      'sort' => 8, 'items' => [
                ['label' => 'Visa',         'icon' => 'visa'],
                ['label' => 'Mastercard',   'icon' => 'mastercard'],
                ['label' => 'Apple Pay',    'icon' => 'applepay'],
                ['label' => 'Google Pay',   'icon' => 'googlepay'],
                ['label' => 'American Express', 'icon' => 'amex'],
                ['label' => 'PayPal',       'icon' => 'paypal'],
            ]],
        ];

        foreach ($menus as $menuRow) {
            $items = $menuRow['items'] ?? [];
            unset($menuRow['items']);
            $menu = Menu::updateOrCreate(['key' => $menuRow['key']], $menuRow);

            // Replace items wholesale on re-seed so admin edits aren't blown away
            // for already-edited menus. We only seed if menu has zero items.
            if ($menu->items()->count() === 0) {
                foreach ($items as $i => $itemRow) {
                    $menu->items()->create($itemRow + [
                        'sort' => $i + 1,
                        'is_active' => true,
                        'target' => $itemRow['target'] ?? '_self',
                    ]);
                }
            }
        }

        // ---- Legal / info pages (markdown) ----
        $pages = [
            ['slug' => 'terms',          'title' => 'Terms of Service',    'body' => "## Terms of Service\n\nPlaceholder. Replace this with your real terms in the admin panel.\n\n- Governing law: Latvia\n- Effective: 2026"],
            ['slug' => 'privacy',        'title' => 'Privacy Policy',      'body' => "## Privacy Policy\n\nWe collect the minimum data needed to operate the marketplace. Replace this from /admin/pages."],
            ['slug' => 'dpa',            'title' => 'Data Processing Agreement', 'body' => "## DPA\n\nStandard EU SCCs apply. Full text is published at /p/dpa once you fill it in."],
            ['slug' => 'aup',            'title' => 'Acceptable Use Policy', 'body' => "## Acceptable Use Policy\n\nNo abuse, no malware, no rate-limit evasion."],
            ['slug' => 'cookies',        'title' => 'Cookies Notice',      'body' => "## Cookies\n\nWe use cookies for session auth and CSRF protection. No third-party tracking pixels."],
            ['slug' => 'subprocessors',  'title' => 'Subprocessors',       'body' => "## Subprocessors\n\n| Provider | Purpose | Region |\n|---|---|---|\n| Laravel Cloud | Hosting | EU |\n| Postgres | Database | EU |"],
            ['slug' => 'refunds',        'title' => 'Refund Policy',       'body' => "## Refunds\n\nUnused Power is refundable within 30 days of purchase."],
            ['slug' => 'revenue-share',  'title' => 'Revenue share',       'body' => "## Revenue share\n\nSellers keep 70% of buyer power burns. Marketplace keeps 30%."],
            ['slug' => 'disputes',       'title' => 'Dispute handling',    'body' => "## Disputes\n\nOpen a dispute from the buyer console. SLA: 5 business days to first response."],
        ];
        foreach ($pages as $row) {
            Page::updateOrCreate(['slug' => $row['slug']], $row + [
                'is_published' => true,
                'published_at' => now(),
            ]);
        }
    }
}
