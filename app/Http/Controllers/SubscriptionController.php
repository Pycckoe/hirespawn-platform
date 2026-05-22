<?php

namespace App\Http\Controllers;

use App\Models\Agent;
use App\Models\Subscription;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SubscriptionController extends Controller
{
    /**
     * Subscribe the authenticated buyer to an agent. Idempotent — if the
     * buyer already has an active (or paused) subscription we just bounce
     * them to the console.
     */
    public function store(Request $request, Agent $agent): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user, 401);

        // Refuse if the agent isn't approved — keeps draft / pending /
        // rejected listings from being subscribed to by mistake (the
        // catalog shouldn't surface them in the first place, but the
        // detail URL is guessable).
        if ($agent->status !== 'approved') {
            return back()->withErrors(['hire' => 'This agent is not currently available for hire.']);
        }

        $existing = Subscription::query()
            ->where('buyer_id', $user->id)
            ->where('agent_id', $agent->id)
            ->whereIn('status', ['active', 'paused'])
            ->first();

        if ($existing) {
            return redirect()
                ->route('console')
                ->with('status', "Already hired: {$agent->name}");
        }

        $sub = DB::transaction(function () use ($user, $agent) {
            $user->buyerProfile()->firstOrCreate([], []);

            $sub = Subscription::create([
                'buyer_id' => $user->id,
                'agent_id' => $agent->id,
                'status' => 'active',
                'started_at' => now(),
                'current_period_start' => now(),
                'current_period_end' => now()->addMonth(),
            ]);

            $agent->increment('subscribers_count');

            return $sub;
        });

        audit('subscription.hire', $sub, [
            'agent' => $agent->slug,
            'agent_name' => $agent->name,
        ]);

        return redirect()
            ->route('console')
            ->with('status', "✓ Hired {$agent->name} — open Console to configure + run.");
    }

    /**
     * Cancel the buyer's active subscription to an agent. Decrements the
     * social-proof subscriber count so cards stay honest.
     */
    public function destroy(Request $request, Agent $agent): RedirectResponse
    {
        $user = $request->user();

        $sub = Subscription::query()
            ->where('buyer_id', $user->id)
            ->where('agent_id', $agent->id)
            ->whereIn('status', ['active', 'paused'])
            ->first();

        if (! $sub) {
            return back()->with('status', 'No active deployment to cancel.');
        }

        DB::transaction(function () use ($sub, $agent) {
            $sub->update([
                'status' => 'cancelled',
                'cancelled_at' => now(),
                'ends_at' => now(),
            ]);

            if ($agent->subscribers_count > 0) {
                $agent->decrement('subscribers_count');
            }
        });

        audit('subscription.cancel', $sub, [
            'agent' => $agent->slug,
            'agent_name' => $agent->name,
        ]);

        return back()->with('status', "Cancelled deployment of {$agent->name}.");
    }
}
