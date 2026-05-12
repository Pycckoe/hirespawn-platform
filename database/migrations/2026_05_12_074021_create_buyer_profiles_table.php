<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('buyer_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('company_name')->nullable();
            $table->string('vat_number')->nullable();
            $table->string('country', 2)->nullable();
            $table->string('default_payment_method_id')->nullable();
            $table->unsignedBigInteger('total_spent_cents')->default(0);
            $table->unsignedBigInteger('power_balance')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('buyer_profiles');
    }
};
