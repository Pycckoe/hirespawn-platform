<?php

namespace App\Http\Controllers;

use App\Models\Agent;
use App\Models\Payout;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class VendorController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $listings = $user
            ? $user->ownedAgents()
                ->with('category')
                ->get()
                ->map(fn (Agent $agent) => $this->transformListing($agent))
                ->values()
                ->all()
            : [];

        $payouts = $user
            ? $user->payouts()
                ->latest('paid_at')
                ->limit(12)
                ->get()
                ->map(fn (Payout $payout) => $this->transformPayout($payout))
                ->values()
                ->all()
            : [];

        return Inertia::render('Vendor', [
            'listings' => $listings,
            'payouts' => $payouts,
        ]);
    }

    private function transformListing(Agent $agent): array
    {
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
            'subs' => (int) $agent->subscribers_count,
            'runs30d' => 0,
            'rev30d' => 0,
            'rating' => $agent->rating_avg > 0 ? (float) $agent->rating_avg : null,
            'rev_share' => 70,
        ];
    }

    private function transformPayout(Payout $payout): array
    {
        return [
            'date' => $payout->paid_at?->format('M d, Y') ?? '—',
            'period' => ($payout->period_start?->format('M Y') ?? '—'),
            'power' => 0,
            'eur' => intdiv((int) $payout->net_cents, 100),
            'fee' => intdiv((int) $payout->platform_fee_cents, 100),
            'status' => $payout->status,
            'ref' => $payout->reference ?? "PO-{$payout->id}",
        ];
    }
}
