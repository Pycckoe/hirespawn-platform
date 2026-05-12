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
     * Mirrors AGENTS in resources/js/lib/shared.jsx. Creates a shared "Hirespawn
     * Curated" seller user and attaches all the seed agents to it so the
     * catalog has live rows on first boot.
     */
    public function run(): void
    {
        $seller = User::firstOrCreate(
            ['email' => 'curator@hirespawn.com'],
            [
                'name' => 'Hirespawn Curated',
                'password' => Hash::make('placeholder-password-' . bin2hex(random_bytes(8))),
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
            ['id' => 'sdr-pro',  'name' => 'AI SDR',           'role' => 'Cold Outreach', 'rank' => 'O-4', 'vendor' => 'Acme AI',     'power' => 12, 'per_unit' => 'lead',        'rating' => 4.9,  'deployed' => 1247, 'langs' => ['EN', 'RU', 'ES'],            'category' => 'sales',    'integrations' => ['hubspot', 'gmail', 'slack'],     'spec' => '1.2k leads/day'],
            ['id' => 'recruit',  'name' => 'AI Recruiter',     'role' => 'Sourcer',        'rank' => 'O-3', 'vendor' => 'Cohort Labs', 'power' => 28, 'per_unit' => 'profile',     'rating' => 4.8,  'deployed' => 892,  'langs' => ['EN', 'DE'],                  'category' => 'hr',       'integrations' => ['linkedin', 'greenhouse'],        'spec' => '300 candidates/wk'],
            ['id' => 'books',    'name' => 'AI Bookkeeper',    'role' => 'Finance',        'rank' => 'E-7', 'vendor' => 'Ledger.ai',   'power' => 4,  'per_unit' => 'transaction', 'rating' => 4.9,  'deployed' => 2104, 'langs' => ['EN', 'FR', 'DE'],            'category' => 'finance',  'integrations' => ['xero', 'quickbooks', 'stripe'],  'spec' => '99.7% accuracy'],
            ['id' => 'review',   'name' => 'AI Code Reviewer', 'role' => 'Engineering',    'rank' => 'O-5', 'vendor' => 'PullRequest', 'power' => 38, 'per_unit' => 'PR',          'rating' => 4.95, 'deployed' => 3401, 'langs' => ['ANY'],                       'category' => 'eng',      'integrations' => ['github', 'gitlab', 'linear'],    'spec' => '< 90s review'],
            ['id' => 'analyst',  'name' => 'AI Data Analyst',  'role' => 'Research',       'rank' => 'O-3', 'vendor' => 'Querium',     'power' => 22, 'per_unit' => 'query',       'rating' => 4.7,  'deployed' => 612,  'langs' => ['EN'],                        'category' => 'research', 'integrations' => ['snowflake', 'bigquery', 'dbt'],  'spec' => '15s avg query'],
            ['id' => 'legal',    'name' => 'AI Legal Reviewer', 'role' => 'Contracts',     'rank' => 'O-4', 'vendor' => 'Quill Legal', 'power' => 64, 'per_unit' => 'contract',    'rating' => 4.85, 'deployed' => 421,  'langs' => ['EN', 'DE'],                  'category' => 'legal',    'integrations' => ['docusign', 'notion'],            'spec' => '40-pg in 4min'],
            ['id' => 'support',  'name' => 'AI Support Agent', 'role' => 'Customer Care',  'rank' => 'E-5', 'vendor' => 'Helpdesk AI', 'power' => 6,  'per_unit' => 'ticket',      'rating' => 4.6,  'deployed' => 5872, 'langs' => ['EN', 'RU', 'ES', 'DE', 'FR'], 'category' => 'support',  'integrations' => ['zendesk', 'intercom'],           'spec' => '24/7, sub-30s'],
            ['id' => 'designer', 'name' => 'AI Designer',      'role' => 'Design',         'rank' => 'O-2', 'vendor' => 'Mockstar',    'power' => 48, 'per_unit' => 'mock',        'rating' => 4.7,  'deployed' => 234,  'langs' => ['EN'],                        'category' => 'design',   'integrations' => ['figma', 'linear'],               'spec' => '40 mocks/wk'],
        ];

        foreach ($agents as $row) {
            Agent::updateOrCreate(
                ['slug' => $row['id']],
                [
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
                ],
            );
        }
    }
}
