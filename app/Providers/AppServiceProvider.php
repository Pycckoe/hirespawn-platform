<?php

namespace App\Providers;

use App\Listeners\RecordAuthAuditEvents;
use Filament\Notifications\Notification;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        // Make Filament admin toasters more obvious — default duration is
        // 5s which is easy to miss. Bump to 10s globally. Per-notification
        // ->duration(X) overrides this if needed.
        Notification::configureUsing(fn (Notification $n) => $n->duration(10000));

        // Audit-log subscriber — writes one row to audit_events per
        // login / logout / failed login / register / password reset.
        // Business actions still call audit() explicitly from their
        // controllers; this just covers the auth surface for free.
        Event::subscribe(RecordAuthAuditEvents::class);
    }
}
