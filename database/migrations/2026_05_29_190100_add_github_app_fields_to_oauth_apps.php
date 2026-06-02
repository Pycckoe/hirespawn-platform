<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('oauth_apps', function (Blueprint $table) {
            // GitHub Apps authenticate with a numeric App ID + an RSA private
            // key, separate from the OAuth2 client_id / client_secret pair.
            // Optional columns — only the github row uses them.
            $table->string('github_app_id', 40)->nullable()->after('client_id');
            $table->text('encrypted_github_private_key')->nullable()->after('encrypted_signing_secret');
        });
    }

    public function down(): void
    {
        Schema::table('oauth_apps', function (Blueprint $table) {
            $table->dropColumn(['github_app_id', 'encrypted_github_private_key']);
        });
    }
};
