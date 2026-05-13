<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function show(Request $request): Response
    {
        $user = $request->user();
        $profile = $user?->buyerProfile;

        return Inertia::render('Settings', [
            'workspace' => [
                'companyName' => $profile?->company_name ?? '',
                'country' => $profile?->country ?? '',
                'vatNumber' => $profile?->vat_number ?? '',
                'totalSpentCents' => (int) ($profile?->total_spent_cents ?? 0),
                'powerBalance' => (int) ($profile?->power_balance ?? 0),
            ],
            'account' => [
                'name' => $user?->name,
                'email' => $user?->email,
            ],
        ]);
    }

    public function updateWorkspace(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'companyName' => ['required', 'string', 'max:120'],
            'country' => ['nullable', 'string', 'size:2'],
            'vatNumber' => ['nullable', 'string', 'max:32'],
        ]);

        $user = $request->user();
        $profile = $user->buyerProfile()->firstOrCreate([], []);

        $profile->forceFill([
            'company_name' => $validated['companyName'],
            'country' => $validated['country'] ? strtoupper($validated['country']) : null,
            'vat_number' => $validated['vatNumber'] ?: null,
        ])->save();

        return back()->with('status', 'Workspace settings saved.');
    }
}
