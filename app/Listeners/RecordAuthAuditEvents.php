<?php

namespace App\Listeners;

use App\Services\Audit\AuditLog;
use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Auth\Events\Registered;

/**
 * Subscribes to Laravel's built-in auth events and writes an audit row
 * for each. Keeps controllers untouched.
 */
class RecordAuthAuditEvents
{
    public function __construct(private readonly AuditLog $audit) {}

    public function handleLogin(Login $event): void
    {
        $this->audit->record('auth.login', $event->user, [
            'guard' => $event->guard,
        ], userId: $event->user?->getKey());
    }

    public function handleLogout(Logout $event): void
    {
        if ($event->user) {
            $this->audit->record('auth.logout', $event->user, [
                'guard' => $event->guard,
            ], userId: $event->user->getKey());
        }
    }

    public function handleRegistered(Registered $event): void
    {
        $this->audit->record('auth.register', $event->user, [], userId: $event->user?->getKey());
    }

    public function handlePasswordReset(PasswordReset $event): void
    {
        $this->audit->record('auth.password_reset', $event->user, [], userId: $event->user?->getKey());
    }

    public function handleFailed(Failed $event): void
    {
        // No user — failed login. Stamp the attempted email so admins
        // can spot bruteforcing in the global log.
        $this->audit->record('auth.failed', null, [
            'email' => $event->credentials['email'] ?? null,
            'guard' => $event->guard,
        ]);
    }

    public function subscribe(): array
    {
        return [
            Login::class => 'handleLogin',
            Logout::class => 'handleLogout',
            Registered::class => 'handleRegistered',
            PasswordReset::class => 'handlePasswordReset',
            Failed::class => 'handleFailed',
        ];
    }
}
