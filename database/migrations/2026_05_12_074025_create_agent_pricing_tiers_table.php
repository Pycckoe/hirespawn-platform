<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('agent_pricing_tiers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agent_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->unsignedBigInteger('price_cents');
            $table->string('currency', 3)->default('EUR');
            $table->unsignedBigInteger('included_units')->default(0);
            $table->string('unit_name')->nullable();
            $table->unsignedBigInteger('overage_price_cents')->default(0);
            $table->json('features')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agent_pricing_tiers');
    }
};
