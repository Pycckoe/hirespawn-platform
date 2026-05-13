<?php

namespace App\Http\Controllers;

use App\Models\Agent;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminAgentController extends Controller
{
    /**
     * Admin review queue — lists every agent grouped by status so the
     * admin can see the pending pile plus recent decisions.
     */
    public function index(): Response
    {
        $agents = Agent::query()
            ->with(['category', 'seller'])
            ->orderByRaw("CASE status
                WHEN 'pending_review' THEN 1
                WHEN 'rejected' THEN 2
                WHEN 'suspended' THEN 3
                WHEN 'approved' THEN 4
                ELSE 5 END")
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn (Agent $a) => [
                'id' => $a->id,
                'slug' => $a->slug,
                'name' => $a->name,
                'vendor' => $a->vendor,
                'role' => $a->role,
                'rank' => $a->rank,
                'tagline' => $a->tagline,
                'description' => $a->description,
                'category' => $a->category?->name,
                'categorySlug' => $a->category?->slug,
                'powerCost' => (int) $a->power_cost,
                'perUnit' => $a->per_unit,
                'status' => $a->status,
                'seller' => [
                    'name' => $a->seller?->name,
                    'email' => $a->seller?->email,
                ],
                'submittedAt' => $a->created_at?->toIso8601String(),
                'updatedAt' => $a->updated_at?->toIso8601String(),
                'publishedAt' => $a->published_at?->toIso8601String(),
                'languages' => $a->languages ?? [],
                'integrations' => $a->integrations ?? [],
            ])
            ->values()
            ->all();

        $counts = [
            'pending' => Agent::where('status', 'pending_review')->count(),
            'approved' => Agent::where('status', 'approved')->count(),
            'rejected' => Agent::where('status', 'rejected')->count(),
            'suspended' => Agent::where('status', 'suspended')->count(),
        ];

        return Inertia::render('Admin/Agents', [
            'agents' => $agents,
            'counts' => $counts,
        ]);
    }

    public function approve(Request $request, Agent $agent): RedirectResponse
    {
        $agent->forceFill([
            'status' => 'approved',
            'published_at' => $agent->published_at ?? now(),
        ])->save();

        return back()->with('status', "Approved {$agent->name} — now live in the catalog.");
    }

    public function reject(Request $request, Agent $agent): RedirectResponse
    {
        $agent->forceFill([
            'status' => 'rejected',
        ])->save();

        return back()->with('status', "Rejected {$agent->name}.");
    }

    public function suspend(Request $request, Agent $agent): RedirectResponse
    {
        $agent->forceFill([
            'status' => 'suspended',
        ])->save();

        return back()->with('status', "Suspended {$agent->name} — pulled from the catalog.");
    }
}
