<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Platform-managed OAuth client registrations. One row per third-
        // party provider (slack, github, hubspot…). Admin populates these
        // with the platform's own OAuth app credentials at /admin/oauth-apps.
        // Without a row for a provider, no client can connect against it.
        Schema::create('oauth_apps', function (Blueprint $table) {
            $table->id();
            $table->string('provider', 30)->unique();       // slack, github, hubspot, gmail, notion, gdrive
            $table->string('label', 80);                     // "Slack", "GitHub"
            $table->string('icon', 8)->nullable();           // emoji or single char for UI
            $table->string('client_id', 200);
            $table->text('encrypted_client_secret');         // Crypt::encryptString
            $table->string('authorize_url', 300);            // OAuth /authorize endpoint
            $table->string('token_url', 300);                // OAuth /token endpoint
            $table->string('api_base_url', 300)->nullable(); // base for runtime calls
            $table->json('default_scopes')->nullable();      // ["chat:write","users:read"]
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        // One row per (user, provider). Stores the OAuth access + refresh
        // tokens encrypted at rest. Tokens are decrypted on the fly inside
        // ToolExecutor when an oauth_proxy skill needs to call the provider.
        Schema::create('user_oauth_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('provider', 30);
            $table->text('encrypted_access_token');
            $table->text('encrypted_refresh_token')->nullable();
            $table->json('scopes')->nullable();
            $table->string('account_label', 200)->nullable(); // "user@company.com"
            $table->string('account_id', 200)->nullable();    // provider's user/workspace id
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'provider']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_oauth_tokens');
        Schema::dropIfExists('oauth_apps');
    }
};
