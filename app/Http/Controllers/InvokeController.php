<?php

namespace App\Http\Controllers;

use App\Models\Agent;
use App\Models\Subscription;
use App\Models\UsageEvent;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class InvokeController extends Controller
{
    /**
     * Run a single task on an agent. Requires the buyer to have an
     * active subscription and enough Power. We don't wire a real LLM
     * yet — the run is a stub that produces a plausible canned output
     * per category and logs a UsageEvent so the dashboards have real
     * numbers to chart.
     */
    public function store(Request $request, Agent $agent): RedirectResponse
    {
        $validated = $request->validate([
            'input' => ['required', 'string', 'max:4000'],
        ]);

        $user = $request->user();

        $subscription = Subscription::query()
            ->where('buyer_id', $user->id)
            ->where('agent_id', $agent->id)
            ->whereIn('status', ['active', 'paused'])
            ->first();

        if (! $subscription) {
            return back()->with('status', "You need to deploy {$agent->name} before running a task.");
        }

        $profile = $user->buyerProfile()->firstOrCreate([], []);
        $cost = (int) $agent->power_cost;

        if ($profile->power_balance < $cost) {
            return back()->with('status', "Not enough Power. {$cost}⚡ required, you have {$profile->power_balance}⚡. Top up to run.");
        }

        $output = $this->stubOutput($agent, $validated['input']);
        $latency = random_int(80, 2200);
        $requestId = 'run_'.Str::random(12);
        $costCents = (int) round($cost * 0.009 * 100);

        DB::transaction(function () use ($profile, $subscription, $agent, $cost, $latency, $requestId, $costCents, $validated, $output) {
            $profile->decrement('power_balance', $cost);

            UsageEvent::create([
                'subscription_id' => $subscription->id,
                'event_type' => 'run',
                'units_consumed' => 1,
                'unit_type' => $agent->per_unit,
                'power_consumed' => $cost,
                'request_id' => $requestId,
                'agent_response_status' => 200,
                'latency_ms' => $latency,
                'cost_cents' => $costCents,
                'recorded_at' => now(),
                'metadata' => [
                    'input_preview' => Str::limit($validated['input'], 200),
                    'output_preview' => Str::limit($output, 200),
                    'agent_slug' => $agent->slug,
                ],
            ]);
        });

        return back()->with('status', "✓ {$agent->name} ran your task. Burned {$cost}⚡ in {$latency}ms.");
    }

    /**
     * Tiny canned outputs per agent category so the Console feed isn't
     * empty while the real LLM gateway isn't built yet.
     */
    private function stubOutput(Agent $agent, string $input): string
    {
        $category = $agent->category?->slug ?? 'sales';
        $preview = Str::limit($input, 80);

        return match ($category) {
            'sales' => "Drafted outreach for: \"{$preview}\". 3 personalisation hooks, CTA = book demo.",
            'eng' => "Reviewed: \"{$preview}\". 4 comments, 1 blocker (null check), 2 suggested tests.",
            'support' => "Triaged: \"{$preview}\". Tag=refund. Suggested macro = R-204. ETA reply: 2m.",
            'finance' => "Reconciled batch: \"{$preview}\". 142 tx matched, 3 anomalies flagged for review.",
            'hr' => "Sourced 12 candidates for: \"{$preview}\". 4 highly likely, 6 maybe, 2 weak.",
            'legal' => "Reviewed clause: \"{$preview}\". 1 risk (uncapped liability), 2 markup suggestions.",
            'research' => "Synthesised: \"{$preview}\". 3 sources, 2 cohort splits, summary in console.",
            'design' => "Generated 6 mocks for: \"{$preview}\". Figma file shared, brand-tight, locale-ready.",
            default => "Task completed for: \"{$preview}\". See logs for details.",
        };
    }
}
