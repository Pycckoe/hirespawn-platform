<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workspace_members', function (Blueprint $table) {
            $table->id();
            // Owner = the buyer_profile owner. We key off the user_id of the
            // workspace owner; members can later resolve to their own user.
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->string('email');
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('role', 24)->default('member'); // owner | admin | member | viewer
            $table->string('status', 16)->default('invited'); // invited | active | revoked
            $table->string('invite_token', 64)->nullable()->unique();
            $table->timestamp('invited_at')->nullable();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamps();

            $table->unique(['owner_id', 'email']);
            $table->index(['owner_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workspace_members');
    }
};
