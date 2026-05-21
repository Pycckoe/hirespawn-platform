<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Two distinct surfaces — but the row shape is the same so we
        // collapse them into one table with a `kind` discriminator.
        //
        // - kind='support' : visitor / authenticated user reaches out
        //                    via /support (a contact form)
        // - kind='dispute' : buyer files a dispute against an active
        //                    subscription via /vendor (vendor side) or
        //                    /console (buyer side)
        Schema::create('support_tickets', function (Blueprint $table) {
            $table->id();
            $table->string('kind', 16)->default('support');     // support|dispute
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('subscription_id')->nullable()->constrained()->nullOnDelete();
            $table->string('reference', 32)->unique();          // ST-2026-00042 / DSP-2026-00017
            $table->string('name', 120);
            $table->string('email', 191);
            $table->string('subject', 200);
            $table->string('category', 40)->nullable();         // billing / agent_failure / abuse / general
            $table->text('body');
            $table->string('status', 16)->default('open');      // open|investigating|resolved|closed
            $table->unsignedInteger('refund_power')->nullable(); // dispute-only: power credited back
            $table->json('metadata')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->index(['kind', 'status']);
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('support_tickets');
    }
};
