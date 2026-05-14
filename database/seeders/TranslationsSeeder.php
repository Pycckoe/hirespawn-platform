<?php

namespace Database\Seeders;

use App\Models\Translation;
use Illuminate\Database\Seeder;

class TranslationsSeeder extends Seeder
{
    /**
     * Seed the English baseline for marketing + dashboard copy. Admins
     * can edit any row from /admin/translations and add new locales by
     * duplicating rows with a different `locale` code.
     *
     * Naming convention: lowercase, dotted, namespaced. Sections use
     * "section.kicker" / "section.title" / "section.sub" so the same
     * pattern repeats across the homepage marketing strip.
     */
    public function run(): void
    {
        $rows = [
            // ── Hero (homepage) ───────────────────────────────────────────
            ['key' => 'hero.pill',        'value' => '● Live · 12,847 agents on duty'],
            ['key' => 'hero.subtitle',    'value' => 'The marketplace for AI employees. No subscriptions, no headcount. Buy Power once — every agent in the roster runs on it. Pay only for tasks executed.'],
            ['key' => 'hero.cta_primary', 'value' => 'Buy Power →'],
            ['key' => 'hero.cta_browse',  'value' => 'Browse the roster'],
            ['key' => 'hero.stat_agents',  'value' => 'Agents on duty'],
            ['key' => 'hero.stat_burned',  'value' => 'Power burned (24h)'],
            ['key' => 'hero.stat_circ',    'value' => 'Power in circulation'],

            // ── Section · Power explainer ─────────────────────────────────
            ['key' => 'power.kicker', 'value' => 'Power · the unit of work'],
            ['key' => 'power.sub',    'value' => 'No more subscriptions per agent. Buy a Power pack once. Allocate it across whichever specialists you hire. Each agent declares its Power cost upfront — fair, predictable, audited.'],

            // ── Section · Pricing / packs ─────────────────────────────────
            ['key' => 'pricing.kicker', 'value' => 'Pricing'],
            ['key' => 'pricing.sub',    'value' => 'Volume discount built in. Higher pack = lower €/Power. Power rolls over (90 days Starter, 12 months Pro & Scale).'],

            // ── Section · Roster ──────────────────────────────────────────
            ['key' => 'roster.kicker', 'value' => 'The roster'],

            // ── Section · How it works ────────────────────────────────────
            ['key' => 'how.kicker', 'value' => 'Mission flow'],

            // ── Section · Integrations ────────────────────────────────────
            ['key' => 'integrations.kicker', 'value' => 'Integrations'],
            ['key' => 'integrations.sub',    'value' => 'Each agent declares the tools it speaks. Connect once at the gateway level — every agent inherits your auth.'],

            // ── Section · Testimonials ────────────────────────────────────
            ['key' => 'testimonials.kicker', 'value' => 'Field reports'],

            // ── Section · FAQ ─────────────────────────────────────────────
            ['key' => 'faq.kicker', 'value' => 'Intelligence briefing'],

            // ── CTA marquee (footer-adjacent) ─────────────────────────────
            ['key' => 'cta.pill', 'value' => '● Recruiting now · 12,847 agents on duty'],

            // ── Console (buyer dashboard) ─────────────────────────────────
            ['key' => 'console.greeting_evening', 'value' => 'Good evening'],
            ['key' => 'console.greeting_sub',     'value' => "Here's what your roster shipped while you were away."],
            ['key' => 'console.greeting_empty',   'value' => 'Your workspace is ready — hire your first agent to get started.'],
            ['key' => 'console.kpi_power',        'value' => 'Power balance'],
            ['key' => 'console.kpi_burn24h',      'value' => 'Burned (24h)'],
            ['key' => 'console.kpi_burn30d',      'value' => 'Burned (30d)'],
            ['key' => 'console.kpi_agents',       'value' => 'Active agents'],
            ['key' => 'console.empty_agents',     'value' => 'No agents deployed yet'],
            ['key' => 'console.empty_agents_sub', 'value' => 'Browse the roster to hire your first AI agent.'],
            ['key' => 'console.empty_ops',        'value' => "Nothing's running yet"],
            ['key' => 'console.empty_ops_sub',    'value' => 'Hire an agent — runs land here in real time.'],
            ['key' => 'console.empty_billing',    'value' => 'No invoices yet'],
            ['key' => 'console.empty_billing_sub','value' => 'Top up power to start your billing history.'],

            // ── Vendor (seller dashboard) ─────────────────────────────────
            ['key' => 'vendor.greeting',          'value' => 'Welcome back'],
            ['key' => 'vendor.greeting_empty',    'value' => 'Publish your first agent to start earning Power.'],
            ['key' => 'vendor.kpi_power30d',      'value' => 'Power earned (30d)'],
            ['key' => 'vendor.kpi_eur30d',        'value' => 'EUR earned (30d)'],
            ['key' => 'vendor.kpi_subs',          'value' => 'Active subs'],
            ['key' => 'vendor.kpi_rating',        'value' => 'Avg rating'],
            ['key' => 'vendor.empty_listings',    'value' => 'No listings yet'],
            ['key' => 'vendor.empty_listings_sub','value' => 'Publish your first agent to start earning Power.'],
            ['key' => 'vendor.empty_subs',        'value' => 'No subscriptions yet'],
            ['key' => 'vendor.empty_disputes',    'value' => 'No disputes'],

            // ── Buttons / common labels ───────────────────────────────────
            ['key' => 'btn.buy_power',     'value' => 'Buy Power'],
            ['key' => 'btn.hire_agent',    'value' => 'Hire agent'],
            ['key' => 'btn.browse_roster', 'value' => 'Browse roster →'],
            ['key' => 'btn.publish_new',   'value' => '+ Publish new'],
            ['key' => 'btn.cash_out',      'value' => 'Cash out →'],
        ];

        foreach ($rows as $row) {
            Translation::updateOrCreate(
                [
                    'locale' => 'en',
                    'namespace' => 'site',
                    'key' => $row['key'],
                ],
                [
                    'value' => $row['value'],
                ],
            );
        }
    }
}
