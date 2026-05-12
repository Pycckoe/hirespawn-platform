<?php

namespace Database\Seeders;

use App\Models\BuyerProfile;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $this->call([
            AgentCategorySeeder::class,
            AgentSeeder::class,
            PowerPackSeeder::class,
        ]);

        $test = User::factory()->create([
            'name' => 'Test Buyer',
            'email' => 'test@example.com',
        ]);

        BuyerProfile::firstOrCreate(
            ['user_id' => $test->id],
            ['country' => 'LV', 'power_balance' => 25000],
        );
    }
}
