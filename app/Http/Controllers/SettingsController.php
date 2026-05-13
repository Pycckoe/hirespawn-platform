<?php

namespace App\Http\Controllers;

use App\Models\ApiKey;
use App\Models\Invoice;
use App\Models\UsageEvent;
use App\Models\WorkspaceMember;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function show(Request $request): Response
    {
        $user = $request->user();
        $profile = $user?->buyerProfile;

        $apiKeys = $user
            ? $user->apiKeys()
                ->latest('id')
                ->get()
                ->map(fn (ApiKey $k) => $this->transformKey($k))
                ->values()
                ->all()
            : [];

        $members = $user
            ? WorkspaceMember::query()
                ->where('owner_id', $user->id)
                ->orderByRaw("CASE status WHEN 'active' THEN 0 WHEN 'invited' THEN 1 ELSE 2 END")
                ->latest('id')
                ->get()
                ->map(fn (WorkspaceMember $m) => $this->transformMember($m))
                ->values()
                ->all()
            : [];

        $invoices = $user
            ? $user->invoices()
                ->latest('created_at')
                ->limit(24)
                ->get()
                ->map(fn (Invoice $i) => $this->transformInvoice($i))
                ->values()
                ->all()
            : [];

        $billing = $this->billingSummary($user);

        // Owner row appears at the top of members regardless of table state.
        $ownerRow = $user ? [
            'id' => 'owner',
            'email' => $user->email,
            'name' => $user->name,
            'role' => 'owner',
            'status' => 'active',
            'invitedAt' => null,
            'acceptedAt' => $user->created_at?->format('M d, Y'),
            'isOwner' => true,
        ] : null;

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
            'apiKeys' => $apiKeys,
            'members' => $ownerRow ? array_merge([$ownerRow], $members) : $members,
            'invoices' => $invoices,
            'billing' => $billing,
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

    // ---------------- API keys ----------------

    public function storeKey(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'environment' => ['nullable', Rule::in(['live', 'test'])],
        ]);

        $env = $validated['environment'] ?? 'live';
        $secretBody = Str::random(40);
        $prefix = 'hsp_'.$env.'_'.substr($secretBody, 0, 4);
        $plaintext = $prefix.'_'.$secretBody;

        $key = $request->user()->apiKeys()->create([
            'name' => $validated['name'],
            'prefix' => $prefix,
            'hash' => ApiKey::hashSecret($plaintext),
            'environment' => $env,
        ]);

        // Flash the plaintext exactly once. The next page load won't see it.
        return back()
            ->with('status', "API key “{$key->name}” created.")
            ->with('apiKeySecret', [
                'id' => $key->id,
                'name' => $key->name,
                'secret' => $plaintext,
            ]);
    }

    public function revokeKey(Request $request, ApiKey $apiKey): RedirectResponse
    {
        abort_unless($apiKey->user_id === $request->user()->id, 403);
        if (! $apiKey->isRevoked()) {
            $apiKey->forceFill(['revoked_at' => now()])->save();
        }

        return back()->with('status', "API key “{$apiKey->name}” revoked.");
    }

    // ---------------- Workspace members ----------------

    public function storeMember(Request $request): RedirectResponse
    {
        $user = $request->user();
        $ownEmail = strtolower($user->email);

        $validated = $request->validate([
            'email' => [
                'required', 'email:rfc', 'max:191',
                function (string $attribute, mixed $value, \Closure $fail) use ($ownEmail) {
                    if (strtolower(trim((string) $value)) === $ownEmail) {
                        $fail('You are already the workspace owner.');
                    }
                },
            ],
            'role' => ['required', Rule::in(['admin', 'member', 'viewer'])],
        ]);

        $email = strtolower(trim($validated['email']));

        WorkspaceMember::updateOrCreate(
            ['owner_id' => $user->id, 'email' => $email],
            [
                'role' => $validated['role'],
                'status' => 'invited',
                'invite_token' => Str::random(40),
                'invited_at' => now(),
            ],
        );

        return back()->with('status', "Invite sent to {$email}.");
    }

    public function destroyMember(Request $request, WorkspaceMember $member): RedirectResponse
    {
        abort_unless($member->owner_id === $request->user()->id, 403);
        $email = $member->email;
        $member->delete();

        return back()->with('status', "Removed {$email} from workspace.");
    }

    // ---------------- transforms ----------------

    private function transformKey(ApiKey $k): array
    {
        return [
            'id' => $k->id,
            'name' => $k->name,
            'prefix' => $k->prefix,
            'environment' => $k->environment,
            'lastUsed' => $k->last_used_at?->diffForHumans() ?? 'never',
            'createdAt' => $k->created_at?->format('M d, Y'),
            'revokedAt' => $k->revoked_at?->format('M d, Y'),
            'status' => $k->isRevoked() ? 'revoked' : 'active',
        ];
    }

    private function transformMember(WorkspaceMember $m): array
    {
        return [
            'id' => $m->id,
            'email' => $m->email,
            'name' => $m->user?->name,
            'role' => $m->role,
            'status' => $m->status,
            'invitedAt' => $m->invited_at?->format('M d, Y'),
            'acceptedAt' => $m->accepted_at?->format('M d, Y'),
            'isOwner' => false,
        ];
    }

    private function transformInvoice(Invoice $i): array
    {
        return [
            'id' => $i->id,
            'period' => $i->period_start?->format('M Y') ?? $i->created_at->format('M Y'),
            'totalCents' => (int) $i->total_cents,
            'vatCents' => (int) $i->vat_cents,
            'currency' => $i->currency,
            'status' => $i->status,
            'paidAt' => $i->paid_at?->format('M d, Y'),
            'dueAt' => $i->due_at?->format('M d, Y'),
            'pdfUrl' => $i->pdf_url,
        ];
    }

    /**
     * Quick billing summary derived from on-platform usage events. Until
     * Stripe is wired we synthesise rolling-30d spend from UsageEvent rows
     * on the buyer's subscriptions, so the Billing tab is never empty.
     */
    private function billingSummary($user): array
    {
        if (! $user) {
            return [
                'powerBalance' => 0,
                'lifetimeSpentCents' => 0,
                'spent30dCents' => 0,
                'burn30d' => 0,
                'autoTopup' => false,
                'paymentMethod' => null,
            ];
        }

        $subIds = $user->subscriptions()->pluck('id');
        $burn30d = (int) UsageEvent::query()
            ->whereIn('subscription_id', $subIds)
            ->where('recorded_at', '>=', Carbon::now()->subDays(30))
            ->sum('power_consumed');

        $spent30dCents = (int) UsageEvent::query()
            ->whereIn('subscription_id', $subIds)
            ->where('recorded_at', '>=', Carbon::now()->subDays(30))
            ->sum('cost_cents');

        return [
            'powerBalance' => (int) ($user->buyerProfile?->power_balance ?? 0),
            'lifetimeSpentCents' => (int) ($user->buyerProfile?->total_spent_cents ?? 0),
            'spent30dCents' => $spent30dCents,
            'burn30d' => $burn30d,
            'autoTopup' => false,
            'paymentMethod' => null, // wired with Stripe in a later pass
        ];
    }
}
