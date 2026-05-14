<?php

namespace App\Providers;

use Filament\Notifications\Notification;
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
    }
}
