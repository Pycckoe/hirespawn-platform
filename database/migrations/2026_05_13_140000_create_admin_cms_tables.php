<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('site_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key', 80)->unique();
            $table->string('group', 40)->default('general');
            $table->string('label', 200);
            $table->text('value')->nullable();
            $table->string('type', 20)->default('text'); // text | textarea | url | json | bool
            $table->text('description')->nullable();
            $table->unsignedInteger('sort')->default(0);
            $table->timestamps();

            $table->index(['group', 'sort']);
        });

        Schema::create('currencies', function (Blueprint $table) {
            $table->id();
            $table->string('code', 3)->unique();
            $table->string('symbol', 4);
            $table->string('name', 60);
            $table->boolean('is_active')->default(true);
            $table->boolean('is_default')->default(false);
            $table->unsignedInteger('sort')->default(0);
            $table->timestamps();

            $table->index('is_active');
        });

        Schema::create('payment_method_types', function (Blueprint $table) {
            $table->id();
            $table->string('key', 32)->unique();
            $table->string('label', 80);
            $table->string('description')->nullable();
            // 'buyer' (top-ups), 'seller' (payouts), 'both'
            $table->string('audience', 12);
            $table->string('icon', 4)->nullable(); // emoji or short text
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort')->default(0);
            $table->timestamps();

            $table->index(['audience', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_method_types');
        Schema::dropIfExists('currencies');
        Schema::dropIfExists('site_settings');
    }
};
