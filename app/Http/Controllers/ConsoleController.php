<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ConsoleController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('Console', [
            'subscriptions' => $user?->subscriptions()->with('agent')->get() ?? [],
            'powerBalance' => $user?->buyerProfile?->power_balance ?? 0,
        ]);
    }
}
