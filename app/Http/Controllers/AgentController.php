<?php

namespace App\Http\Controllers;

use App\Models\Agent;
use Inertia\Inertia;
use Inertia\Response;

class AgentController extends Controller
{
    public function index(): Response
    {
        $agents = Agent::query()
            ->where('status', 'approved')
            ->with(['category', 'seller'])
            ->orderByDesc('rating_avg')
            ->get();

        return Inertia::render('Catalog', [
            'agents' => $agents,
        ]);
    }

    public function show(Agent $agent): Response
    {
        $agent->load(['category', 'seller', 'pricingTiers', 'screenshots', 'reviews.buyer']);

        return Inertia::render('AgentDetail', [
            'agent' => $agent,
            'agentId' => $agent->slug,
        ]);
    }
}
