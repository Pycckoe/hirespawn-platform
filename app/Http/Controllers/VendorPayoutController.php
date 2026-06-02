<?php

namespace App\Http\Controllers;

use App\Models\Payout;
use App\Models\PayoutMethod;
use App\Models\PayoutMethodType;
use App\Models\UsageEvent;
use App\Support\Rates;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class VendorPayoutController extends Controller
{
    // ---------------- Methods CRUD ----------------

    public function storeMethod(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'type' => ['required', Rule::in(['bank', 'card', 'paypal', 'wise', 'crypto'])],
            'label' => ['required', 'string', 'max:80'],
            'holderName' => ['nullable', 'string', 'max:120'],
            'country' => ['nullable', 'string', 'size:2'],
            'currency' => ['required', 'string', 'min:3', 'max:8'],
            'identifier' => ['required', 'string', 'max:200'], // IBAN / card / email / wallet
            'routingHint' => ['nullable', 'string', 'max:64'],
            'makeDefault' => ['nullable', 'boolean'],
        ]);

        $user = $request->user();
        $type = $validated['type'];
        $identifier = trim($validated['identifier']);

        // Mask the identifier per type — we never store full account numbers.
        [$last4, $routingHint, $detailExtra] = $this->summariseIdentifier($type, $identifier, $validated['routingHint'] ?? null);

        $method = $user->payoutMethods()->create([
            'type' => $type,
            'label' => $validated['label'],
            'holder_name' => $validated['holderName'] ?? null,
            'country' => isset($validated['country']) && $validated['country']
                ? strtoupper($validated['country'])
                : null,
            'currency' => strtoupper($validated['currency']),
            'account_last4' => $last4,
            'routing_hint' => $routingHint,
            'details' => $detailExtra,
            'is_default' => false,
        ]);

        // If this is the user's first method, mark it default automatically.
        $isFirst = $user->payoutMethods()->count() === 1;
        if ($isFirst || $request->boolean('makeDefault')) {
            $this->markDefault($user->id, $method->id);
        }

        return back()->with('status', "Payout method “{$method->label}” added.");
    }

    public function defaultMethod(Request $request, PayoutMethod $method): RedirectResponse
    {
        abort_unless($method->user_id === $request->user()->id, 403);
        $this->markDefault($request->user()->id, $method->id);

        return back()->with('status', "“{$method->label}” is now the default payout destination.");
    }

    public function destroyMethod(Request $request, PayoutMethod $method): RedirectResponse
    {
        abort_unless($method->user_id === $request->user()->id, 403);
        $label = $method->label;
        $wasDefault = $method->is_default;
        $method->delete();

        // If we just removed the default, promote any other method to default.
        if ($wasDefault) {
            $next = $request->user()->payoutMethods()->oldest('id')->first();
            if ($next) {
                $this->markDefault($request->user()->id, $next->id);
            }
        }

        return back()->with('status', "Removed payout method “{$label}”.");
    }

    // ---------------- Cash out ----------------

    public function requestPayout(Request $request): RedirectResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'amountCents' => ['required', 'integer', 'min:1'],
            'methodId' => ['required', 'integer', 'exists:payout_methods,id'],
        ]);

        $method = PayoutMethod::find($validated['methodId']);
        abort_unless($method && $method->user_id === $user->id, 403);

        // Look up the catalog row for this method's type to read live
        // fee_percent / fee_flat_cents / min_amount_cents from admin.
        $type = PayoutMethodType::where('key', $method->type)
            ->where('is_active', true)
            ->first();

        if (! $type) {
            throw ValidationException::withMessages([
                'methodId' => "This payout method type is no longer available. Pick another destination.",
            ]);
        }

        $minCents = (int) $type->min_amount_cents;
        if ($validated['amountCents'] < $minCents) {
            throw ValidationException::withMessages([
                'amountCents' => 'Minimum payout for '.$type->label.' is €'.number_format($minCents / 100, 2).'.',
            ]);
        }

        $available = $this->availableCents($user);
        if ($validated['amountCents'] > $available) {
            throw ValidationException::withMessages([
                'amountCents' => "Requested amount exceeds available balance of €".number_format($available / 100, 2).'.',
            ]);
        }

        $feeCents = $type->calculateFeeCents($validated['amountCents']);
        $netCents = $validated['amountCents'] - $feeCents;

        DB::transaction(function () use ($user, $method, $validated, $feeCents, $netCents) {
            Payout::create([
                'seller_id' => $user->id,
                'period_start' => now()->subDays(30),
                'period_end' => now(),
                'gross_cents' => $validated['amountCents'],
                'platform_fee_cents' => $feeCents,
                'vat_cents' => 0,
                'net_cents' => $netCents,
                'currency' => $method->currency ?? 'EUR',
                'status' => 'pending',
                'payment_method' => $method->type,
                'reference' => 'PO-'.now()->format('Ymd').'-'.strtoupper(Str::random(6)),
            ]);
        });

        return back()->with(
            'status',
            'Payout requested: €'.number_format($netCents / 100, 2).' to '.$method->display().' (fee €'.number_format($feeCents / 100, 2).')'
        );
    }

    // ---------------- helpers ----------------

    private function markDefault(int $userId, int $methodId): void
    {
        DB::transaction(function () use ($userId, $methodId) {
            PayoutMethod::where('user_id', $userId)->update(['is_default' => false]);
            PayoutMethod::where('id', $methodId)->where('user_id', $userId)->update(['is_default' => true]);
        });
    }

    /**
     * Available cents = lifetime earned cents − already-requested/paid cents.
     */
    private function availableCents($user): int
    {
        $agentIds = $user->ownedAgents()->pluck('id');
        if ($agentIds->isEmpty()) {
            return 0;
        }

        $totalPower = (int) UsageEvent::query()
            ->whereHas('subscription', fn ($q) => $q->whereIn('agent_id', $agentIds))
            ->sum('power_consumed');

        $earnedCents = Rates::sellerEarnedCents($totalPower);

        $alreadyOut = (int) Payout::query()
            ->where('seller_id', $user->id)
            ->whereIn('status', ['pending', 'processing', 'paid'])
            ->sum('gross_cents');

        return max(0, $earnedCents - $alreadyOut);
    }

    /**
     * Produce safe display fields from a raw identifier without persisting it.
     *
     * @return array{0: string|null, 1: string|null, 2: array<string, mixed>|null}
     */
    private function summariseIdentifier(string $type, string $identifier, ?string $routingHint): array
    {
        $compact = preg_replace('/\s+/', '', $identifier) ?? $identifier;

        return match ($type) {
            'bank' => [
                substr($compact, -4),
                $routingHint ?: strtoupper(substr($compact, 0, 4)), // IBAN first 4 chars
                null,
            ],
            'card' => [
                substr(preg_replace('/\D/', '', $compact) ?? '', -4),
                $routingHint ?: null,
                null,
            ],
            'paypal' => [
                null,
                'PayPal',
                ['email_masked' => $this->maskEmail($identifier)],
            ],
            'wise' => [
                substr($compact, -4),
                $routingHint ?: 'Wise',
                null,
            ],
            'crypto' => [
                substr($compact, -4),
                $routingHint ?: 'Wallet',
                ['network' => $routingHint ?: 'unknown'],
            ],
            default => [null, null, null],
        };
    }

    private function maskEmail(string $email): string
    {
        if (! str_contains($email, '@')) {
            return '***';
        }
        [$local, $domain] = explode('@', $email, 2);
        $head = mb_substr($local, 0, 1);
        $tail = mb_strlen($local) > 1 ? mb_substr($local, -1) : '';

        return $head.'***'.$tail.'@'.$domain;
    }
}
