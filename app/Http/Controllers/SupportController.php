<?php

namespace App\Http\Controllers;

use App\Models\Subscription;
use App\Models\SupportTicket;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SupportController extends Controller
{
    /**
     * Public + authenticated contact / help form. Pre-fills the user's
     * name + email when signed in so they don't retype.
     */
    public function show(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('Support', [
            'prefill' => [
                'name' => $user?->name ?? '',
                'email' => $user?->email ?? '',
            ],
            'isAuthenticated' => (bool) $user,
            'supportEmail' => \App\Models\SiteSetting::lookup('support_email', 'support@hirespawn.com'),
            'avgResponseHours' => (int) (\App\Models\SiteSetting::lookup('support_avg_response_hours') ?? 12),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email:rfc', 'max:191'],
            'subject' => ['required', 'string', 'max:200'],
            'category' => ['nullable', Rule::in(['general', 'billing', 'agent_failure', 'abuse', 'account', 'integrations', 'feature_request'])],
            'body' => ['required', 'string', 'max:8000'],
        ]);

        $ticket = SupportTicket::create([
            'kind' => 'support',
            'user_id' => $request->user()?->id,
            'reference' => $this->generateReference('ST'),
            'name' => $validated['name'],
            'email' => strtolower($validated['email']),
            'subject' => $validated['subject'],
            'category' => $validated['category'] ?? 'general',
            'body' => $validated['body'],
            'status' => 'open',
        ]);

        audit('support.ticket_created', $ticket, [
            'category' => $ticket->category,
            'reference' => $ticket->reference,
        ]);

        return back()->with('status', "✓ Ticket {$ticket->reference} created. We'll reply within {$this->avgResponseHours()} hours.");
    }

    /**
     * Buyer-side dispute submission. Filed against a subscription the
     * buyer owns. Visible to the vendor through their Disputes tab.
     */
    public function storeDispute(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user, 401);

        $validated = $request->validate([
            'subscription_id' => ['required', 'integer', 'exists:subscriptions,id'],
            'subject' => ['required', 'string', 'max:200'],
            'category' => ['nullable', Rule::in(['sla_breach', 'incorrect_output', 'data_leak', 'overcharged', 'integration_broken', 'other'])],
            'body' => ['required', 'string', 'max:8000'],
            'refund_power' => ['nullable', 'integer', 'min:0', 'max:10000000'],
        ]);

        $sub = Subscription::query()
            ->where('id', $validated['subscription_id'])
            ->where('buyer_id', $user->id)
            ->firstOrFail();

        $ticket = SupportTicket::create([
            'kind' => 'dispute',
            'user_id' => $user->id,
            'subscription_id' => $sub->id,
            'reference' => $this->generateReference('DSP'),
            'name' => $user->name,
            'email' => strtolower($user->email),
            'subject' => $validated['subject'],
            'category' => $validated['category'] ?? 'other',
            'body' => $validated['body'],
            'refund_power' => $validated['refund_power'] ?? null,
            'status' => 'open',
        ]);

        audit('dispute.opened', $ticket, [
            'reference' => $ticket->reference,
            'subscription_id' => $sub->id,
            'agent' => $sub->agent?->slug,
        ]);

        return redirect()
            ->route('console')
            ->with('status', "✓ Dispute {$ticket->reference} opened. Vendor + support team notified.");
    }

    private function generateReference(string $prefix): string
    {
        $year = Carbon::now()->format('Y');
        $count = SupportTicket::query()
            ->whereYear('created_at', $year)
            ->where('reference', 'like', "{$prefix}-{$year}-%")
            ->count() + 1;

        return sprintf('%s-%s-%05d', $prefix, $year, $count);
    }

    private function avgResponseHours(): int
    {
        return (int) (\App\Models\SiteSetting::lookup('support_avg_response_hours') ?? 12);
    }
}
