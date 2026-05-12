<?php

namespace App\Http\Controllers;

use App\Models\Subscription;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ConsoleController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $subscriptions = $user
            ? $user->subscriptions()
                ->with(['agent.category'])
                ->get()
                ->map(fn (Subscription $sub) => $this->transformSubscription($sub))
                ->values()
                ->all()
            : [];

        return Inertia::render('Console', [
            'subscriptions' => $subscriptions,
            'powerBalance' => (int) ($user?->buyerProfile?->power_balance ?? 0),
        ]);
    }

    private function transformSubscription(Subscription $sub): array
    {
        $agent = $sub->agent;

        return [
            'id' => $agent?->slug,
            'name' => $agent?->name,
            'role' => $agent?->role,
            'tone' => $agent?->category?->slug ?? 'sales',
            'power' => (int) ($agent?->power_cost ?? 0),
            'perUnit' => $agent?->per_unit,
            'runs24h' => 0,
            'runs7d' => 0,
            'failRate' => 0,
            'latency' => '—',
            'spend24h' => 0,
            'status' => $sub->status === 'active' ? 'on' : 'paused',
        ];
    }
}
