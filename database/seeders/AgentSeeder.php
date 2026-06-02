<?php

namespace Database\Seeders;

use App\Models\Agent;
use App\Models\AgentCategory;
use App\Models\SellerProfile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AgentSeeder extends Seeder
{
    /**
     * Mirrors AGENTS + ROSTER_EXT in the original design so the catalog has
     * the full 18-agent roster on first boot.
     */
    public function run(): void
    {
        $seller = User::firstOrCreate(
            ['email' => 'curator@hirespawn.com'],
            [
                'name' => 'Hirespawn Curated',
                'password' => Hash::make('placeholder-password-'.bin2hex(random_bytes(8))),
                'email_verified_at' => now(),
            ],
        );

        SellerProfile::firstOrCreate(
            ['user_id' => $seller->id],
            [
                'company_name' => 'Hirespawn',
                'country' => 'LV',
                'kyc_status' => 'verified',
                'kyc_verified_at' => now(),
                'rating_avg' => 4.85,
            ],
        );

        $categoryByKey = AgentCategory::query()->pluck('id', 'slug')->all();

        $agents = [
            ['id' => 'sdr-pro',     'name' => 'AI SDR',            'role' => 'Cold Outreach',  'rank' => 'O-4', 'vendor' => 'Acme AI',     'power' => 12, 'per_unit' => 'lead',        'rating' => 4.9,  'deployed' => 1247, 'langs' => ['EN', 'RU', 'ES'],            'category' => 'sales',    'integrations' => ['hubspot', 'gmail', 'slack'],     'spec' => '1.2k leads/day'],
            ['id' => 'recruit',     'name' => 'AI Recruiter',      'role' => 'Sourcer',         'rank' => 'O-3', 'vendor' => 'Cohort Labs', 'power' => 28, 'per_unit' => 'profile',     'rating' => 4.8,  'deployed' => 892,  'langs' => ['EN', 'DE'],                  'category' => 'hr',       'integrations' => ['linkedin', 'greenhouse'],        'spec' => '300 candidates/wk'],
            ['id' => 'books',       'name' => 'AI Bookkeeper',     'role' => 'Finance',         'rank' => 'E-7', 'vendor' => 'Ledger.ai',   'power' => 4,  'per_unit' => 'transaction', 'rating' => 4.9,  'deployed' => 2104, 'langs' => ['EN', 'FR', 'DE'],            'category' => 'finance',  'integrations' => ['xero', 'quickbooks', 'stripe'],  'spec' => '99.7% accuracy'],
            ['id' => 'review',      'name' => 'AI Code Reviewer',  'role' => 'Engineering',     'rank' => 'O-5', 'vendor' => 'PullRequest', 'power' => 38, 'per_unit' => 'PR',          'rating' => 4.95, 'deployed' => 3401, 'langs' => ['ANY'],                       'category' => 'eng',      'integrations' => ['github', 'gitlab', 'linear'],    'spec' => '< 90s review'],
            ['id' => 'analyst',     'name' => 'AI Data Analyst',   'role' => 'Research',        'rank' => 'O-3', 'vendor' => 'Querium',     'power' => 22, 'per_unit' => 'query',       'rating' => 4.7,  'deployed' => 612,  'langs' => ['EN'],                        'category' => 'research', 'integrations' => ['snowflake', 'bigquery', 'dbt'],  'spec' => '15s avg query'],
            ['id' => 'legal',       'name' => 'AI Legal Reviewer', 'role' => 'Contracts',       'rank' => 'O-4', 'vendor' => 'Quill Legal', 'power' => 64, 'per_unit' => 'contract',    'rating' => 4.85, 'deployed' => 421,  'langs' => ['EN', 'DE'],                  'category' => 'legal',    'integrations' => ['docusign', 'notion'],            'spec' => '40-pg in 4min'],
            ['id' => 'support',     'name' => 'AI Support Agent',  'role' => 'Customer Care',   'rank' => 'E-5', 'vendor' => 'Helpdesk AI', 'power' => 6,  'per_unit' => 'ticket',      'rating' => 4.6,  'deployed' => 5872, 'langs' => ['EN', 'RU', 'ES', 'DE', 'FR'], 'category' => 'support',  'integrations' => ['zendesk', 'intercom'],           'spec' => '24/7, sub-30s'],
            ['id' => 'designer',    'name' => 'AI Designer',       'role' => 'Design',          'rank' => 'O-2', 'vendor' => 'Mockstar',    'power' => 48, 'per_unit' => 'mock',        'rating' => 4.7,  'deployed' => 234,  'langs' => ['EN'],                        'category' => 'design',   'integrations' => ['figma', 'linear'],               'spec' => '40 mocks/wk'],
            // Extended roster — only on the Catalog page in the original design.
            ['id' => 'pm-pilot',    'name' => 'AI Product Manager','role' => 'Product Ops',     'rank' => 'O-3', 'vendor' => 'Roadmap.ai',  'power' => 32, 'per_unit' => 'spec',        'rating' => 4.7,  'deployed' => 312,  'langs' => ['EN', 'DE'],                  'category' => 'eng',      'integrations' => ['linear', 'notion', 'figma'],     'spec' => 'spec → ticket in 2min'],
            ['id' => 'mktg-copy',   'name' => 'AI Copywriter',     'role' => 'Marketing',       'rank' => 'E-6', 'vendor' => 'Wordforge',   'power' => 8,  'per_unit' => '500 words',   'rating' => 4.6,  'deployed' => 1820, 'langs' => ['EN', 'RU', 'ES', 'DE'],      'category' => 'sales',    'integrations' => ['notion', 'hubspot', 'wordpress'],'spec' => 'brand-tuned'],
            ['id' => 'qa-bot',      'name' => 'AI QA Engineer',    'role' => 'Engineering',     'rank' => 'E-7', 'vendor' => 'TestForge',   'power' => 18, 'per_unit' => 'test run',    'rating' => 4.85, 'deployed' => 940,  'langs' => ['ANY'],                       'category' => 'eng',      'integrations' => ['github', 'playwright', 'linear'],'spec' => 'flaky-test detection'],
            ['id' => 'fin-fcst',    'name' => 'AI Forecaster',     'role' => 'Finance',         'rank' => 'O-4', 'vendor' => 'Ledger.ai',   'power' => 44, 'per_unit' => 'scenario',    'rating' => 4.8,  'deployed' => 187,  'langs' => ['EN'],                        'category' => 'finance',  'integrations' => ['snowflake', 'xero', 'stripe'],   'spec' => 'monte-carlo, 12mo'],
            ['id' => 'ops-ticket',  'name' => 'AI Triager',        'role' => 'Customer Care',   'rank' => 'E-5', 'vendor' => 'Helpdesk AI', 'power' => 3,  'per_unit' => 'ticket',      'rating' => 4.65, 'deployed' => 4221, 'langs' => ['EN', 'RU', 'DE', 'FR'],      'category' => 'support',  'integrations' => ['zendesk', 'intercom', 'slack'],  'spec' => 'routes in 200ms'],
            ['id' => 'comp-mon',    'name' => 'AI Competitor Watch','role' => 'Research',       'rank' => 'O-2', 'vendor' => 'Querium',     'power' => 16, 'per_unit' => 'report',      'rating' => 4.5,  'deployed' => 410,  'langs' => ['EN', 'DE'],                  'category' => 'research', 'integrations' => ['notion', 'slack', 'rss'],        'spec' => 'daily digest'],
            ['id' => 'design-bran', 'name' => 'AI Brand Stylist',  'role' => 'Design',          'rank' => 'O-2', 'vendor' => 'Mockstar',    'power' => 36, 'per_unit' => 'asset pack',  'rating' => 4.55, 'deployed' => 156,  'langs' => ['EN'],                        'category' => 'design',   'integrations' => ['figma', 'notion'],               'spec' => 'on-brand 99%'],
            ['id' => 'legal-priv',  'name' => 'AI Privacy Officer','role' => 'Compliance',      'rank' => 'O-3', 'vendor' => 'Quill Legal', 'power' => 52, 'per_unit' => 'audit',       'rating' => 4.7,  'deployed' => 88,   'langs' => ['EN', 'DE', 'FR'],            'category' => 'legal',    'integrations' => ['notion', 'docusign'],            'spec' => 'GDPR + DSA + AI Act'],
            ['id' => 'hr-onboard',  'name' => 'AI Onboarder',      'role' => 'HR',              'rank' => 'E-6', 'vendor' => 'Cohort Labs', 'power' => 14, 'per_unit' => 'new hire',    'rating' => 4.8,  'deployed' => 521,  'langs' => ['EN', 'DE'],                  'category' => 'hr',       'integrations' => ['greenhouse', 'slack', 'notion'], 'spec' => '14-day program'],
            ['id' => 'sec-watch',   'name' => 'AI SecOps',         'role' => 'Security',        'rank' => 'O-5', 'vendor' => 'PullRequest', 'power' => 26, 'per_unit' => 'alert',       'rating' => 4.9,  'deployed' => 712,  'langs' => ['ANY'],                       'category' => 'eng',      'integrations' => ['github', 'datadog', 'slack'],    'spec' => 'CVE + SAST'],
        ];

        // IMPORTANT: Laravel Cloud runs db:seed on EVERY deploy. Agents are
        // fully editable by admins/sellers now (owner, LLM model, prompt,
        // pricing, status, …), so we must NOT clobber an existing row — that
        // would, e.g., reset a reassigned seller_id back to the curator and
        // break the agent's API-key resolution. Only insert agents whose
        // slug is missing (bootstrap a fresh DB); leave existing ones alone.
        foreach ($agents as $row) {
            if (Agent::query()->where('slug', $row['id'])->exists()) {
                continue;
            }

            Agent::create([
                'slug' => $row['id'],
                'seller_id' => $seller->id,
                'category_id' => $categoryByKey[$row['category']] ?? null,
                'name' => $row['name'],
                'role' => $row['role'],
                'rank' => $row['rank'],
                'vendor' => $row['vendor'],
                'tagline' => $row['spec'],
                'description' => "{$row['name']} is a curated marketplace agent specializing in {$row['role']}. Spec: {$row['spec']}.",
                'status' => 'approved',
                'pricing_model' => 'usage_based',
                'power_cost' => $row['power'],
                'per_unit' => $row['per_unit'],
                'currency' => 'EUR',
                'rating_avg' => $row['rating'],
                'subscribers_count' => $row['deployed'],
                'languages' => $row['langs'],
                'integrations' => $row['integrations'],
                'spec' => $row['spec'],
                'sla_uptime_pct' => 99.5,
                'published_at' => now(),
            ]);
        }
    }
}
