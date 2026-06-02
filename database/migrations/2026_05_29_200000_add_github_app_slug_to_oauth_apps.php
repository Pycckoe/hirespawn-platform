<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('oauth_apps', function (Blueprint $table) {
            // The human-readable URL slug of the GitHub App (the part after
            // "/apps/" in the App's public URL, e.g. "hirespawn-dev"). Used
            // to build the install link. Distinct from the OAuth Client ID
            // (which looks like "Iv23li…") so admins don't conflate them.
            $table->string('github_app_slug', 80)->nullable()->after('github_app_id');
        });
    }

    public function down(): void
    {
        Schema::table('oauth_apps', function (Blueprint $table) {
            $table->dropColumn('github_app_slug');
        });
    }
};
