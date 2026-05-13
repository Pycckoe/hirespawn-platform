<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_method_types', function (Blueprint $table) {
            // Effective fee = ceil(amount_cents × fee_percent / 100) + fee_flat_cents
            // Default 1% / €0 mirrors the previous hardcoded VendorPayoutController rate.
            $table->decimal('fee_percent', 5, 2)->default(1.00)->after('audience');
            $table->unsignedInteger('fee_flat_cents')->default(0)->after('fee_percent');
            $table->unsignedInteger('min_amount_cents')->default(1000)->after('fee_flat_cents');
        });
    }

    public function down(): void
    {
        Schema::table('payment_method_types', function (Blueprint $table) {
            $table->dropColumn(['fee_percent', 'fee_flat_cents', 'min_amount_cents']);
        });
    }
};
