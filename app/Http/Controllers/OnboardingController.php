<?php

namespace App\Http\Controllers;

use App\Models\Agent;
use App\Models\PowerPack;
use App\Models\Subscription;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingController extends Controller
{
    /**
     * Welcome amount (in ⚡) we credit to every buyer on activation.
     */
    private const WELCOME_POWER_BONUS = 5000;

    /**
     * Slugs of agents we surface as the "first hire" options. Order matters
     * (popular first); the page pre-selects the first one.
     */
    private const STARTER_AGENT_SLUGS = ['sdr-pro', 'analyst', 'support', 'qa-bot'];

    public function show(Request $request): Response
    {
        $user = $request->user();

        $packs = PowerPack::query()
            ->orderBy('sort_order')
            ->get()
            ->map(fn (PowerPack $p) => [
                'slug' => $p->slug,
                'name' => $p->name,
                'power' => $p->power,
                'eur' => $p->price_cents !== null ? intdiv($p->price_cents, 100) : null,
                'perPower' => (float) $p->per_power_eur,
                'popular' => (bool) $p->is_popular,
            ])
            ->values()
            ->all();

        $agents = Agent::query()
            ->whereIn('slug', self::STARTER_AGENT_SLUGS)
            ->where('status', 'approved')
            ->get()
            ->sortBy(fn (Agent $a) => array_search($a->slug, self::STARTER_AGENT_SLUGS))
            ->map(fn (Agent $a) => [
                'id' => $a->slug,
                'name' => $a->name,
                'role' => $a->role,
                'power' => (int) $a->power_cost,
                'icon' => $a->category?->icon ?? '◇',
                'tone' => $a->category?->slug ?? 'sales',
            ])
            ->values()
            ->all();

        return Inertia::render('Onboarding', [
            'powerPacks' => $packs,
            'starterAgents' => $agents,
            'defaults' => [
                'workspace' => $user?->name ? "{$user->name}'s workspace" : 'Acme Inc',
                'pack' => $this->popularPackSlug($packs) ?? ($packs[0]['slug'] ?? 'pro'),
                'agentId' => $agents[0]['id'] ?? null,
            ],
            'welcomeBonus' => self::WELCOME_POWER_BONUS,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'workspace' => ['required', 'string', 'max:120'],
            'pack' => ['required', 'string', 'exists:power_packs,slug'],
            'agent' => ['required', 'string', 'exists:agents,slug'],
        ]);

        $user = $request->user();
        $agent = Agent::where('slug', $validated['agent'])->firstOrFail();

        DB::transaction(function () use ($user, $validated, $agent) {
            $profile = $user->buyerProfile()->firstOrCreate([], []);

            $updates = ['company_name' => $validated['workspace']];

            // Grant the welcome bonus exactly once — only when this is the
            // user's first onboarding pass. We key off the buyer profile
            // being brand new (created in this same request).
            if ($profile->wasRecentlyCreated) {
                $updates['power_balance'] = $profile->power_balance + self::WELCOME_POWER_BONUS;
            }

            $profile->forceFill($updates)->save();

            // Idempotent: only create the starter subscription once.
            $alreadySubscribed = Subscription::query()
                ->where('buyer_id', $user->id)
                ->where('agent_id', $agent->id)
                ->whereIn('status', ['active', 'paused'])
                ->exists();

            if (! $alreadySubscribed) {
                Subscription::create([
                    'buyer_id' => $user->id,
                    'agent_id' => $agent->id,
                    'status' => 'active',
                    'started_at' => now(),
                    'current_period_start' => now(),
                    'current_period_end' => now()->addMonth(),
                    'metadata' => ['source' => 'onboarding', 'pack_slug' => $validated['pack']],
                ]);
                $agent->increment('subscribers_count');
            }
        });

        return redirect()
            ->route('console')
            ->with('status', "Welcome aboard. {$agent->name} is on duty.");
    }

    private function popularPackSlug(array $packs): ?string
    {
        foreach ($packs as $p) {
            if (! empty($p['popular'])) {
                return $p['slug'];
            }
        }

        return null;
    }
}
