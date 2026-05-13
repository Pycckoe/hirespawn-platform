<?php

namespace App\Http\Controllers;

use App\Models\Agent;
use App\Models\Payout;
use App\Models\Subscription;
use App\Models\UsageEvent;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class VendorController extends Controller
{
    /**
     * Seller's revenue share — buyer's power burns × this fraction
     * lands in the seller's pocket. The marketplace keeps the rest.
     */
    private const SELLER_SHARE = 0.70;

    /**
     * EUR cents per ⚡ at the Pro rate, used to convert power to revenue.
     */
    private const EUR_CENTS_PER_POWER = 0.9;

    public function index(Request $request): Response
    {
        $user = $request->user();

        $ownedAgents = $user
            ? $user->ownedAgents()->with('category')->get()
            : collect();

        $agentIds = $ownedAgents->pluck('id')->all();

        // All usage events on this seller's agents in the last 30 days.
        $events30d = $agentIds
            ? UsageEvent::query()
                ->whereHas('subscription', fn ($q) => $q->whereIn('agent_id', $agentIds))
                ->where('recorded_at', '>=', Carbon::now()->subDays(30))
                ->with('subscription:id,agent_id')
                ->get()
            : collect();

        $usageByAgent = $events30d->groupBy(fn ($e) => $e->subscription?->agent_id);
        $activeSubsByAgent = $ownedAgents->isEmpty()
            ? collect()
            : Subscription::query()
                ->whereIn('agent_id', $agentIds)
                ->where('status', 'active')
                ->get()
                ->groupBy('agent_id');

        $listings = $ownedAgents
            ->map(fn (Agent $agent) => $this->transformListing($agent, $usageByAgent->get($agent->id, collect()), $activeSubsByAgent->get($agent->id, collect())->count()))
            ->values()
            ->all();

        $payouts = $user
            ? $user->payouts()
                ->latest('paid_at')
                ->limit(12)
                ->get()
                ->map(fn (Payout $payout) => $this->transformPayout($payout))
                ->values()
                ->all()
            : [];

        $totalPower30d = (int) $events30d->sum('power_consumed');
        $sellerEur30d = (int) round($totalPower30d * self::EUR_CENTS_PER_POWER / 100 * self::SELLER_SHARE);

        return Inertia::render('Vendor', [
            'listings' => $listings,
            'payouts' => $payouts,
            'metrics' => [
                'powerEarned30d' => $totalPower30d,
                'eurEarned30d' => $sellerEur30d,
                'activeSubs' => (int) $activeSubsByAgent->flatten()->count(),
                'totalRuns30d' => $events30d->count(),
                'avgRating' => $this->avgRating($ownedAgents),
            ],
        ]);
    }

    private function transformListing(Agent $agent, $events30d, int $activeSubs): array
    {
        $runs30d = $events30d->count();
        $power30d = (int) $events30d->sum('power_consumed');

        return [
            'id' => $agent->slug,
            'name' => $agent->name,
            'cat' => $agent->category?->name ?? 'Sales',
            'icon' => $agent->category?->icon ?? '◇',
            'power' => (int) $agent->power_cost,
            'perUnit' => $agent->per_unit,
            'status' => match ($agent->status) {
                'approved' => 'live',
                'suspended' => 'paused',
                'pending_review' => 'review',
                'rejected' => 'rejected',
                'draft' => 'draft',
                default => $agent->status,
            },
            'subs' => $activeSubs,
            'runs30d' => $runs30d,
            'rev30d' => $power30d, // raw power earned by this agent over 30d
            'rating' => $agent->rating_avg > 0 ? (float) $agent->rating_avg : null,
            'rev_share' => (int) (self::SELLER_SHARE * 100),
        ];
    }

    private function transformPayout(Payout $payout): array
    {
        return [
            'date' => $payout->paid_at?->format('M d, Y') ?? '—',
            'period' => $payout->period_start?->format('M Y') ?? '—',
            'power' => 0,
            'eur' => intdiv((int) $payout->net_cents, 100),
            'fee' => intdiv((int) $payout->platform_fee_cents, 100),
            'status' => $payout->status,
            'ref' => $payout->reference ?? "PO-{$payout->id}",
        ];
    }

    private function avgRating($agents): float
    {
        $rated = $agents->filter(fn ($a) => $a->rating_avg > 0);
        if ($rated->isEmpty()) {
            return 0.0;
        }

        return round($rated->avg('rating_avg'), 2);
    }
}
