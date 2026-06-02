<?php

namespace Database\Seeders;

use App\Models\PowerPack;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class PowerPackSeeder extends Seeder
{
    /**
     * Power packs that back the Pricing page and PowerCheckout. Numbers,
     * audience copy and feature lists are taken from the original
     * Hirespawn design's standalone Pricing tiers.
     */
    public function run(): void
    {
        $packs = [
            [
                'name' => 'Starter',
                'power' => 25000,
                'price' => 249,
                'per_power' => 0.0099,
                'popular' => false,
                'audience' => 'Solo operators · 1-3 agents · light usage',
                'perks' => [
                    '25k⚡ + 5k free on signup',
                    'All public agents',
                    'Standard 90d log retention',
                    'Email support · 24h SLA',
                ],
            ],
            [
                'name' => 'Pro',
                'power' => 100000,
                'price' => 899,
                'per_power' => 0.0089,
                'popular' => true,
                'audience' => 'Growth teams · 5-15 agents · daily runs',
                'perks' => [
                    '100k⚡ · ≈ 1,700 runs',
                    'Featured + early-access agents',
                    '180d log retention',
                    'Slack Connect support',
                    'SSO via Okta/Google',
                    'Audit log + RBAC',
                ],
            ],
            [
                'name' => 'Scale',
                'power' => 500000,
                'price' => 3999,
                'per_power' => 0.0079,
                'popular' => false,
                'audience' => 'Heavy ops · 20+ agents · production critical',
                'perks' => [
                    '500k⚡ · ≈ 8,500 runs',
                    'Volume bulk discount',
                    '365d log retention + cold storage',
                    'Dedicated CSM',
                    'Custom data residency',
                    'SLA refunds in EUR (not Power)',
                ],
            ],
            [
                'name' => 'Fleet',
                'power' => 2000000,
                'price' => 13999,
                'per_power' => 0.0070,
                'popular' => false,
                'audience' => 'Enterprise · 100+ agents · multi-region',
                'perks' => [
                    'Unlimited Power · custom rate',
                    'White-glove agent onboarding',
                    'Private vendor agreements',
                    'On-prem gateway option',
                    'Procurement-friendly invoicing',
                    '24/7 phone + Slack',
                ],
            ],
        ];

        foreach ($packs as $i => $pack) {
            PowerPack::updateOrCreate(
                ['slug' => Str::slug($pack['name'])],
                [
                    'name' => $pack['name'],
                    'power' => $pack['power'],
                    'price_cents' => $pack['price'] !== null ? $pack['price'] * 100 : null,
                    'currency' => 'EUR',
                    'per_power_eur' => $pack['per_power'],
                    'is_popular' => $pack['popular'],
                    'audience' => $pack['audience'],
                    'perks' => $pack['perks'],
                    'sort_order' => $i,
                ],
            );
        }
    }
}
