<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Per-user toggles for the events we send notifications for.
            // Format: { low_power: true, agent_failed: true, payout_sent: false, ... }.
            // Null = use defaults. Lives on users.notification_prefs so we
            // don't need an extra join on every notification dispatch.
            $table->json('notification_prefs')->nullable()->after('remember_token');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('notification_prefs');
        });
    }
};
