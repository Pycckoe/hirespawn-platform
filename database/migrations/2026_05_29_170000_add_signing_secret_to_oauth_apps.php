<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('oauth_apps', function (Blueprint $table) {
            // Slack (and similar) sign inbound event/webhook requests with a
            // separate "signing secret" — distinct from the OAuth client
            // secret. Stored encrypted; used to verify POST /integrations/
            // slack/events really came from Slack.
            $table->text('encrypted_signing_secret')->nullable()->after('encrypted_client_secret');
        });
    }

    public function down(): void
    {
        Schema::table('oauth_apps', function (Blueprint $table) {
            $table->dropColumn('encrypted_signing_secret');
        });
    }
};
