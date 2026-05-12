<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('power_packs', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->unsignedBigInteger('power');
            $table->unsignedBigInteger('price_cents')->nullable();
            $table->string('currency', 3)->default('EUR');
            $table->decimal('per_power_eur', 8, 6)->nullable();
            $table->boolean('is_popular')->default(false);
            $table->json('perks')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('power_packs');
    }
};
