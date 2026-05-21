<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Persistent audit log. Every meaningful action — auth events,
        // CRUD on important models (agents, subscriptions, api keys,
        // payouts, oauth tokens), Filament admin actions — lands here.
        //
        // The Security tab on /settings reads from this; the prior
        // synthesised activity (from joining api_keys + oauth_tokens +
        // invoices) becomes obsolete once enough rows accumulate.
        Schema::create('audit_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            // Polymorphic subject — the thing the event acted on (an
            // Agent / Subscription / ApiKey / SiteSetting row, or null
            // for system-wide events like a login).
            $table->string('subject_type', 60)->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();
            // Stable verb. Convention: dot-separated namespace.verb,
            // e.g. agent.create, subscription.configure, auth.login,
            // oauth.connect, api_key.revoke, settings.password_update.
            $table->string('event_type', 80);
            // Free-form context (what changed, fields diff, args, etc.)
            $table->json('metadata')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 400)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['user_id', 'created_at']);
            $table->index(['event_type', 'created_at']);
            $table->index(['subject_type', 'subject_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_events');
    }
};
