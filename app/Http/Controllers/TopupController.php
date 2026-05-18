<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\PowerPack;
use App\Models\SiteSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TopupController extends Controller
{
    /**
     * Minimum top-up size in EUR — anything below this never makes sense
     * after Stripe fees. Stored on `min_topup_eur` site setting, defaults
     * to 5€ when the setting is missing.
     */
    private const FALLBACK_MIN_EUR = 5;

    /**
     * Hard upper bound (€) so a typo can't accidentally invoice millions.
     * Big customers go through "Talk to sales" on /pricing instead.
     */
    private const MAX_EUR = 50000;

    /**
     * Accepts either a pre-defined pack (by slug) or a free-form custom
     * amount in cents. Creates a pending Invoice for that amount; the
     * Power is only credited once payment clears (Stripe webhook flips
     * the invoice to "paid"). Until Stripe is wired the buyer sees the
     * invoice on /console under "Billing & history" with status=pending.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user, 401);

        $data = $request->validate([
            'pack_slug' => 'nullable|string|max:60|exists:power_packs,slug',
            'amount_cents' => 'nullable|integer|min:100|max:'.(self::MAX_EUR * 100),
        ]);

        $minEur = (int) (SiteSetting::value('min_topup_eur') ?? self::FALLBACK_MIN_EUR);
        $eurCentsPerPower = (float) (SiteSetting::value('eur_cents_per_power') ?? 0.9);

        // Resolve the chosen amount + Power either from the pack the
        // buyer ticked, or from the free-form custom-amount input.
        if (! empty($data['pack_slug'])) {
            $pack = PowerPack::query()->where('slug', $data['pack_slug'])->firstOrFail();
            if ($pack->price_cents === null) {
                // "Talk to sales" pack — bounce them to the contact route.
                return back()->with('status', "{$pack->name} is custom-priced — talk to sales for a quote.");
            }
            $amountCents = (int) $pack->price_cents;
            $power = (int) $pack->power;
            $description = "Power top-up · {$pack->name} pack";
        } else {
            $amountCents = (int) ($data['amount_cents'] ?? 0);
            if ($amountCents < $minEur * 100) {
                return back()->withErrors([
                    'amount_cents' => "Minimum top-up is €{$minEur}.",
                ]);
            }
            // Custom amounts are billed at the Starter (lowest tier)
            // €/⚡ rate; volume packs offer a better rate to incentivise
            // commitment. Falls back to the CMS-managed flat rate if no
            // priced Starter pack exists.
            $starter = PowerPack::query()
                ->whereNotNull('price_cents')
                ->orderBy('sort_order')
                ->first();
            $rateCents = $starter && $starter->per_power_eur > 0
                ? (float) $starter->per_power_eur * 100
                : max($eurCentsPerPower, 0.001);
            $power = (int) floor($amountCents / $rateCents);
            $eurDisplay = number_format($amountCents / 100, 2, '.', '');
            $description = "Power top-up · €{$eurDisplay} (custom)";
        }

        $invoice = DB::transaction(function () use ($user, $amountCents, $description) {
            return Invoice::create([
                'buyer_id' => $user->id,
                'subscription_id' => null,
                'subtotal_cents' => $amountCents,
                'vat_cents' => (int) round($amountCents * 0.20),
                'total_cents' => (int) round($amountCents * 1.20),
                'currency' => 'EUR',
                'status' => 'pending',
                'due_at' => now()->addDays(7),
            ]);
        });

        // TODO(stripe): kick off Stripe Checkout session here and redirect
        // to its URL. For now the invoice stays "pending" until paid —
        // visible to the buyer on /console under Billing & history.

        return redirect()
            ->route('console')
            ->with('status', "{$description} · invoice #{$invoice->id} pending payment.");
    }
}
