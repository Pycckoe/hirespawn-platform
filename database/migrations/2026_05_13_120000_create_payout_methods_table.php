<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payout_methods', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type', 16); // bank | card | paypal | crypto | wise
            $table->string('label', 80);
            $table->string('holder_name', 120)->nullable();
            $table->string('country', 2)->nullable();
            $table->string('currency', 3)->default('EUR');
            $table->string('account_last4', 8)->nullable();
            $table->string('routing_hint', 64)->nullable(); // IBAN country+checksum / SWIFT / network
            $table->json('details')->nullable(); // masked extra fields (PayPal email, wallet address)
            $table->boolean('is_default')->default(false);
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'is_default']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payout_methods');
    }
};
