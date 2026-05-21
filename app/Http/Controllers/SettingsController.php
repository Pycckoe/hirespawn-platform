<?php

namespace App\Http\Controllers;

use App\Models\ApiKey;
use App\Models\Invoice;
use App\Models\OauthApp;
use App\Models\PowerPack;
use App\Models\UsageEvent;
use App\Models\User;
use App\Models\WorkspaceMember;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
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
                'emailVerifiedAt' => $user?->email_verified_at?->format('M d, Y H:i'),
                'createdAt' => $user?->created_at?->format('M d, Y'),
            ],
            'apiKeys' => $apiKeys,
            'members' => $ownerRow ? array_merge([$ownerRow], $members) : $members,
            'invoices' => $invoices,
            'billing' => $billing,
            // Power packs + economics — drives the inline top-up panel
            // on the Billing tab. Same shape PageController@power ships
            // to /power so the math + submission target stay identical.
            'powerPacks' => $this->powerPacks(),
            // Tabs that landed in this commit:
            'integrations' => $this->integrations($user),
            'security' => $this->securityData($user, $request),
            'notifications' => $this->notificationData($user),
        ]);
    }

    /**
     * OAuth providers the buyer can connect — same shape as the Console
     * tab so the UI components are interchangeable.
     */
    private function integrations(?User $user): array
    {
        return OauthApp::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get()
            ->map(function (OauthApp $app) use ($user) {
                $token = $user?->oauthTokenFor($app->provider);

                return [
                    'provider' => $app->provider,
                    'label' => $app->label,
                    'icon' => $app->icon,
                    'scopes' => $app->default_scopes ?? [],
                    'connected' => (bool) $token,
                    'accountLabel' => $token?->account_label,
                    'connectedAt' => $token?->created_at?->format('M d, Y'),
                    'expiresAt' => $token?->expires_at?->format('M d, Y H:i'),
                    'expired' => $token?->isExpired() ?? false,
                ];
            })
            ->values()
            ->all();
    }

    /**
     * Security tab — active sessions + a synthesised recent-activity
     * timeline built from the same tables we already write to (API key
     * creates, OAuth connects, power top-ups). No new logs table yet;
     * good enough until a dedicated audit log lands.
     */
    private function securityData(?User $user, Request $request): array
    {
        if (! $user) {
            return ['sessions' => [], 'activity' => []];
        }

        // Sessions only available when SESSION_DRIVER=database. Fall
        // through to an empty list if the table isn't present so we
        // don't blow up on file/redis-session installs.
        $sessions = [];
        try {
            $rows = DB::table('sessions')
                ->where('user_id', $user->id)
                ->orderByDesc('last_activity')
                ->limit(10)
                ->get(['id', 'ip_address', 'user_agent', 'last_activity']);
            $currentId = $request->session()?->getId();
            $sessions = $rows->map(fn ($s) => [
                'id' => $s->id,
                'ip' => $s->ip_address,
                'agent' => $this->prettyUserAgent($s->user_agent),
                'lastActive' => Carbon::createFromTimestamp($s->last_activity)->diffForHumans(),
                'current' => $s->id === $currentId,
            ])->values()->all();
        } catch (\Throwable $e) {
            $sessions = [];
        }

        // Real audit log — populated by the AuditLog service from every
        // controller that does anything interesting, plus the auth-event
        // subscriber (login / logout / password reset / failed login).
        $activity = \App\Models\AuditEvent::query()
            ->where('user_id', $user->id)
            ->latest('created_at')
            ->limit(30)
            ->get()
            ->map(fn ($e) => [
                'kind' => $e->event_type,
                'label' => $this->describeEvent($e),
                'icon' => $this->iconForEvent($e->event_type),
                'at' => $e->created_at->diffForHumans(),
                'ts' => $e->created_at->format('M d, Y H:i'),
                'meta' => $e->metadata,
            ])
            ->all();

        return [
            'sessions' => $sessions,
            'activity' => $activity,
            'passwordChangedAt' => null, // wired when we track this; placeholder for UI
        ];
    }

    /**
     * Human-readable label for a single audit_events row. Uses the
     * event_type as the base + any metadata that adds context.
     */
    private function describeEvent(\App\Models\AuditEvent $e): string
    {
        $meta = $e->metadata ?? [];

        return match ($e->event_type) {
            'auth.login' => 'Signed in',
            'auth.logout' => 'Signed out',
            'auth.register' => 'Account created',
            'auth.password_update' => 'Password changed',
            'auth.password_reset' => 'Password reset via email',
            'auth.failed' => 'Failed sign-in attempt'.(isset($meta['email']) ? " · {$meta['email']}" : ''),
            'auth.session_revoke' => 'Signed out another device',
            'api_key.create' => 'API key created'.(isset($meta['name']) ? " · {$meta['name']}" : ''),
            'api_key.revoke' => 'API key revoked'.(isset($meta['name']) ? " · {$meta['name']}" : ''),
            'oauth.connect' => 'Connected '.($meta['provider'] ?? 'integration').(isset($meta['account_label']) ? " · {$meta['account_label']}" : ''),
            'oauth.disconnect' => 'Disconnected '.($meta['provider'] ?? 'integration'),
            'llm_credential.save' => 'Saved '.($meta['provider'] ?? 'LLM').' API key'.(isset($meta['last4']) ? " · ••••{$meta['last4']}" : ''),
            'llm_credential.delete' => 'Removed '.($meta['provider'] ?? 'LLM').' API key',
            'agent.create' => 'Published agent'.(isset($meta['name']) ? " · {$meta['name']}" : ''),
            'agent.update' => 'Updated agent'.(isset($meta['name']) ? " · {$meta['name']}" : ''),
            'workspace.update' => 'Workspace settings updated',
            'notifications.update' => 'Notification preferences updated',
            'member.invite' => 'Invited '.($meta['email'] ?? 'a teammate'),
            'member.remove' => 'Removed '.($meta['email'] ?? 'a teammate'),
            'topup.requested' => 'Power top-up requested'.(isset($meta['amount_cents']) ? ' · €'.number_format($meta['amount_cents'] / 100, 2) : ''),
            'subscription.configure' => 'Configured '.($meta['agent'] ?? 'subscription'),
            default => str_replace(['.', '_'], [' ', ' '], $e->event_type),
        };
    }

    private function iconForEvent(string $eventType): string
    {
        return match (true) {
            str_starts_with($eventType, 'auth.') => '◆',
            str_starts_with($eventType, 'api_key.') => '⌘',
            str_starts_with($eventType, 'oauth.') => '⚷',
            str_starts_with($eventType, 'llm_credential.') => '⚙',
            str_starts_with($eventType, 'agent.') => '◇',
            str_starts_with($eventType, 'workspace.') => '◈',
            str_starts_with($eventType, 'notifications.') => '◉',
            str_starts_with($eventType, 'member.') => '◊',
            str_starts_with($eventType, 'topup.') => '⚡',
            str_starts_with($eventType, 'subscription.') => '▸',
            default => '·',
        };
    }

    private function prettyUserAgent(?string $ua): string
    {
        if (! $ua) {
            return 'Unknown';
        }
        $browser = 'Browser';
        foreach (['Firefox', 'Edg', 'Chrome', 'Safari', 'curl', 'PostmanRuntime'] as $needle) {
            if (str_contains($ua, $needle)) {
                $browser = $needle === 'Edg' ? 'Edge' : $needle;
                break;
            }
        }
        $os = 'Unknown';
        foreach (['Windows', 'Macintosh', 'iPhone', 'Android', 'Linux'] as $needle) {
            if (str_contains($ua, $needle)) {
                $os = $needle === 'Macintosh' ? 'macOS' : $needle;
                break;
            }
        }

        return "{$browser} · {$os}";
    }

    private function notificationData(?User $user): array
    {
        $defaults = User::notificationDefaults();
        if (! $user) {
            return ['defaults' => $defaults, 'prefs' => $defaults];
        }
        $saved = $user->notification_prefs ?? [];

        // Merge: every default key is present, saved values override.
        $prefs = collect($defaults)
            ->map(fn ($v, $k) => array_key_exists($k, $saved) ? (bool) $saved[$k] : (bool) $v)
            ->all();

        return [
            'defaults' => $defaults,
            'prefs' => $prefs,
        ];
    }

    /**
     * Pack list for the Billing-tab top-up widget. Mirrors PageController's
     * version (both `eur`/`price` + `features`/`perks` aliases) so the JS
     * picker reads the same shape it does on /power.
     */
    private function powerPacks(): array
    {
        return PowerPack::query()
            ->orderBy('sort_order')
            ->get()
            ->map(function (PowerPack $p) {
                $eur = $p->price_cents !== null ? intdiv($p->price_cents, 100) : null;
                $perks = $p->perks ?? [];

                return [
                    'name' => $p->name,
                    'slug' => $p->slug,
                    'power' => $p->power,
                    'eur' => $eur,
                    'price' => $eur,
                    'perPower' => (float) $p->per_power_eur,
                    'popular' => (bool) $p->is_popular,
                    'audience' => $p->audience,
                    'features' => $perks,
                    'perks' => $perks,
                    'custom' => $p->price_cents === null,
                ];
            })
            ->values()
            ->all();
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

        audit('workspace.update', $profile, [
            'fields' => array_keys($validated),
        ]);

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

        audit('api_key.create', $key, ['name' => $key->name, 'environment' => $env]);

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

        audit('api_key.revoke', $apiKey, ['name' => $apiKey->name]);

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

        audit('member.invite', null, ['email' => $email, 'role' => $validated['role']]);

        return back()->with('status', "Invite sent to {$email}.");
    }

    public function destroyMember(Request $request, WorkspaceMember $member): RedirectResponse
    {
        abort_unless($member->owner_id === $request->user()->id, 403);
        $email = $member->email;
        $member->delete();

        audit('member.remove', null, ['email' => $email]);

        return back()->with('status', "Removed {$email} from workspace.");
    }

    // ---------------- Security ----------------

    /**
     * Update the buyer's password. Mirrors Breeze's flow but kept inside
     * SettingsController so the Inertia Settings page can submit to a
     * single namespace.
     */
    public function updatePassword(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $request->user()->forceFill([
            'password' => Hash::make($validated['password']),
        ])->save();

        audit('auth.password_update', $request->user());

        return back()->with('status', 'Password updated. Stay safe out there.');
    }

    /**
     * Revoke a sessions-table row by id. Used by the "Active sessions"
     * list to sign out other devices. Only the row's owner can kill it.
     */
    public function revokeSession(Request $request, string $sessionId): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user, 401);

        try {
            $count = DB::table('sessions')
                ->where('id', $sessionId)
                ->where('user_id', $user->id)
                ->delete();
        } catch (\Throwable) {
            return back()->with('status', 'Session storage is not database-backed — nothing to revoke.');
        }

        if ($count) {
            audit('auth.session_revoke', null, ['session_id' => $sessionId]);
        }

        return back()->with('status', $count ? 'Session revoked.' : 'Session not found.');
    }

    // ---------------- Notifications ----------------

    public function updateNotifications(Request $request): RedirectResponse
    {
        $defaults = User::notificationDefaults();
        $rules = collect($defaults)
            ->mapWithKeys(fn ($_, $k) => [$k => ['nullable', 'boolean']])
            ->all();

        $validated = $request->validate($rules);

        $prefs = collect($defaults)
            ->map(fn ($default, $k) => array_key_exists($k, $validated) ? (bool) $validated[$k] : (bool) $default)
            ->all();

        $request->user()->forceFill(['notification_prefs' => $prefs])->save();

        audit('notifications.update', null, ['keys' => array_keys($prefs)]);

        return back()->with('status', 'Notification preferences saved.');
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
