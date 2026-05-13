<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Pay-in (buyer top-ups) and payout (seller withdrawals) are different
     * processes with different gateway providers and fee structures. A
     * single `payment_method_types` table with `audience` conflated the
     * two. Split into two separate catalogs, drop the shared table.
     *
     * Per-user instance data lives in `payout_methods` (existing) for
     * sellers. Buyer top-up instance data will land in a future table.
     */
    public function up(): void
    {
        Schema::dropIfExists('payment_method_types');

        Schema::create('topup_method_types', function (Blueprint $table) {
            $table->id();
            $table->string('key', 32)->unique();
            $table->string('label', 80);
            $table->string('description')->nullable();
            $table->string('icon', 4)->nullable();
            $table->decimal('fee_percent', 5, 2)->default(1.00);
            $table->unsignedInteger('fee_flat_cents')->default(0);
            $table->unsignedInteger('min_amount_cents')->default(500);
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort')->default(0);
            $table->timestamps();

            $table->index('is_active');
        });

        Schema::create('payout_method_types', function (Blueprint $table) {
            $table->id();
            $table->string('key', 32)->unique();
            $table->string('label', 80);
            $table->string('description')->nullable();
            $table->string('icon', 4)->nullable();
            $table->decimal('fee_percent', 5, 2)->default(1.00);
            $table->unsignedInteger('fee_flat_cents')->default(0);
            $table->unsignedInteger('min_amount_cents')->default(1000);
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort')->default(0);
            $table->timestamps();

            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payout_method_types');
        Schema::dropIfExists('topup_method_types');

        // Restore the original combined table shape so reverting to the
        // previous state actually works.
        Schema::create('payment_method_types', function (Blueprint $table) {
            $table->id();
            $table->string('key', 32)->unique();
            $table->string('label', 80);
            $table->string('description')->nullable();
            $table->string('audience', 12);
            $table->decimal('fee_percent', 5, 2)->default(1.00);
            $table->unsignedInteger('fee_flat_cents')->default(0);
            $table->unsignedInteger('min_amount_cents')->default(1000);
            $table->string('icon', 4)->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort')->default(0);
            $table->timestamps();

            $table->index(['audience', 'is_active']);
        });
    }
};
