<?php

namespace Database\Seeders;

use App\Models\Agent;
use App\Models\BuyerProfile;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoUserSeeder extends Seeder
{
    /**
     * Seeds a single ready-to-use demo buyer account so a fresh
     * Hirespawn instance is something you can sign into without
     * registering from scratch. The password is intentionally simple —
     * change it the moment you sign in.
     */
    public function run(): void
    {
        $email = 'admin@hirespawn.com';
        $password = 'ChangeMe!2026';

        $user = User::updateOrCreate(
            ['email' => $email],
            [
                'name' => 'Hirespawn Admin',
                'password' => Hash::make($password),
                'email_verified_at' => now(),
            ],
        );

        BuyerProfile::updateOrCreate(
            ['user_id' => $user->id],
            [
                'company_name' => 'Hirespawn HQ',
                'country' => 'DE',
                'power_balance' => 150000,
                'total_spent_cents' => 0,
            ],
        );

        // Subscribe the demo account to a couple of agents so the
        // Console isn't empty on first sign-in.
        foreach (['sdr-pro', 'support'] as $slug) {
            $agent = Agent::where('slug', $slug)->first();
            if (! $agent) {
                continue;
            }

            $existing = Subscription::query()
                ->where('buyer_id', $user->id)
                ->where('agent_id', $agent->id)
                ->whereIn('status', ['active', 'paused'])
                ->first();

            if ($existing) {
                continue;
            }

            Subscription::create([
                'buyer_id' => $user->id,
                'agent_id' => $agent->id,
                'status' => 'active',
                'started_at' => now(),
                'current_period_start' => now(),
                'current_period_end' => now()->addMonth(),
                'metadata' => ['source' => 'demo-seed'],
            ]);
            $agent->increment('subscribers_count');
        }

        $this->command?->info("Demo buyer seeded: {$email} / {$password}");
        $this->command?->warn('Change this password immediately after first sign-in.');
    }
}
