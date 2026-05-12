<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class VendorController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('Vendor', [
            'agents' => $user?->ownedAgents()->with('category')->get() ?? [],
            'payouts' => $user?->payouts()->latest()->limit(10)->get() ?? [],
        ]);
    }
}
