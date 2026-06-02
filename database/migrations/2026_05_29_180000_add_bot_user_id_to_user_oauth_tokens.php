<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_oauth_tokens', function (Blueprint $table) {
            // For Slack: the U-id of OUR bot user in that workspace. Stored
            // at install time from oauth.v2.access's `bot_user_id`. Used to
            // detect bot participation in a thread (conversations.replies)
            // so we can answer follow-up messages without a fresh @mention.
            $table->string('bot_user_id', 40)->nullable()->after('account_id');
        });
    }

    public function down(): void
    {
        Schema::table('user_oauth_tokens', function (Blueprint $table) {
            $table->dropColumn('bot_user_id');
        });
    }
};
