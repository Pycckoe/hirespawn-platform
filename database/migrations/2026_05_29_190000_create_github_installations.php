<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // One row per GitHub App installation a buyer has authorised. Per-
        // installation tokens are short-lived and fetched on demand from
        // GitHub via the App's JWT; we cache them in Laravel Cache, so this
        // table just maps an installation_id ↔ buyer and remembers which
        // repos that installation grants access to.
        Schema::create('github_installations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedBigInteger('installation_id')->unique();
            $table->string('account_login');           // org or user the install lives under
            $table->string('account_type', 16)->default('User'); // User | Organization
            $table->json('repos')->nullable();          // [{id, full_name, private}]
            $table->timestamp('last_synced_at')->nullable();
            $table->timestamps();

            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('github_installations');
    }
};
