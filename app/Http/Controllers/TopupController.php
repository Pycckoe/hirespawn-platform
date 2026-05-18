<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\PowerPack;
use App\Support\Rates;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TopupController extends Controller
{
    /**
     * Accepts either a pre-defined pack (by slug) or a free-form custom
     * amount in cents. Creates a pending Invoice for that amount; the
     * Power is only credited once payment clears (Stripe webhook flips
     * the invoice to "paid"). Until Stripe is wired the buyer sees the
     * invoice on /console under "Billing & history" with status=pending.
     *
     * All thresholds (min / max / VAT / per-power rate) are read from
     * /admin/site-settings → group "rates" via the Rates helper, so the
     * floor and ceiling can be tuned without a deploy.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user, 401);

        $minEur = Rates::minTopupEur();
        $maxEur = Rates::maxTopupEur();
        $vatFraction = Rates::vatFraction();

        $data = $request->validate([
            'pack_slug' => 'nullable|string|max:60|exists:power_packs,slug',
            'amount_cents' => "nullable|integer|min:100|max:".($maxEur * 100),
        ]);

        // Resolve the chosen amount + Power either from the pack the
        // buyer ticked, or from the free-form custom-amount input.
        if (! empty($data['pack_slug'])) {
            $pack = PowerPack::query()->where('slug', $data['pack_slug'])->firstOrFail();
            if ($pack->price_cents === null) {
                return back()->with('status', "{$pack->name} is custom-priced — talk to sales for a quote.");
            }
            $amountCents = (int) $pack->price_cents;
            $description = "Power top-up · {$pack->name} pack";
        } else {
            $amountCents = (int) ($data['amount_cents'] ?? 0);
            if ($amountCents < $minEur * 100) {
                return back()->withErrors([
                    'amount_cents' => "Minimum top-up is €{$minEur}.",
                ]);
            }
            $eurDisplay = number_format($amountCents / 100, 2, '.', '');
            $description = "Power top-up · €{$eurDisplay} (custom)";
        }

        $invoice = DB::transaction(function () use ($user, $amountCents, $vatFraction) {
            $vat = (int) round($amountCents * $vatFraction);

            return Invoice::create([
                'buyer_id' => $user->id,
                'subscription_id' => null,
                'subtotal_cents' => $amountCents,
                'vat_cents' => $vat,
                'total_cents' => $amountCents + $vat,
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
