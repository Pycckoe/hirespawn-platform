<?php

namespace Database\Seeders;

use App\Models\PowerPack;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class PowerPackSeeder extends Seeder
{
    /**
     * Mirrors POWER_PACKS in resources/js/lib/shared.jsx so the pricing page,
     * checkout, and console all read from the same source.
     */
    public function run(): void
    {
        $packs = [
            ['name' => 'Starter',    'power' => 10000,   'price' => 99,   'per_power' => 0.0099, 'popular' => false, 'perks' => ['1 agent', 'Email support', 'Usage dashboard']],
            ['name' => 'Pro',        'power' => 50000,   'price' => 449,  'per_power' => 0.0090, 'popular' => true,  'perks' => ['5 agents', 'Priority support', 'Webhook routing', 'Team seats × 5']],
            ['name' => 'Scale',      'power' => 250000,  'price' => 1990, 'per_power' => 0.0080, 'popular' => false, 'perks' => ['Unlimited agents', 'Slack channel', 'Custom SLA', 'Team seats × 20']],
            ['name' => 'Enterprise', 'power' => 9999999, 'price' => null, 'per_power' => 0.0065, 'popular' => false, 'perks' => ['Volume pricing', 'Private agents', 'SSO + audit log', 'Dedicated success']],
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
                    'perks' => $pack['perks'],
                    'sort_order' => $i,
                ],
            );
        }
    }
}
