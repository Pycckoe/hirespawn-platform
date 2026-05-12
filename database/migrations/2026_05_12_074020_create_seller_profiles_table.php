<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('seller_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('company_name')->nullable();
            $table->string('vat_number')->nullable();
            $table->string('country', 2)->nullable();
            $table->string('kyc_status')->default('pending');
            $table->string('kyc_provider')->nullable();
            $table->timestamp('kyc_verified_at')->nullable();
            $table->string('payout_method')->nullable();
            $table->string('stripe_connect_id')->nullable();
            $table->string('bizon_merchant_id')->nullable();
            $table->unsignedBigInteger('total_earnings_cents')->default(0);
            $table->decimal('rating_avg', 3, 2)->default(0);
            $table->unsignedInteger('sales_count')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seller_profiles');
    }
};
