<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Same reason as widening currencies.code: stablecoin codes (USDC,
        // USDT, BUSD) are 3-5 chars. Every column that stores a currency
        // code needs to accommodate that, not just the catalog table.
        Schema::table('payout_methods', function (Blueprint $table) {
            $table->string('currency', 8)->default('EUR')->change();
        });

        Schema::table('payouts', function (Blueprint $table) {
            $table->string('currency', 8)->default('EUR')->change();
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->string('currency', 8)->default('EUR')->change();
        });

        Schema::table('agents', function (Blueprint $table) {
            $table->string('currency', 8)->default('EUR')->change();
        });

        // Carbon copy on power_packs (already had it)
        if (Schema::hasColumn('power_packs', 'currency')) {
            Schema::table('power_packs', function (Blueprint $table) {
                $table->string('currency', 8)->default('EUR')->change();
            });
        }
    }

    public function down(): void
    {
        Schema::table('payout_methods', function (Blueprint $table) {
            $table->string('currency', 3)->default('EUR')->change();
        });
        Schema::table('payouts', function (Blueprint $table) {
            $table->string('currency', 3)->default('EUR')->change();
        });
        Schema::table('invoices', function (Blueprint $table) {
            $table->string('currency', 3)->default('EUR')->change();
        });
        Schema::table('agents', function (Blueprint $table) {
            $table->string('currency', 3)->default('EUR')->change();
        });
        if (Schema::hasColumn('power_packs', 'currency')) {
            Schema::table('power_packs', function (Blueprint $table) {
                $table->string('currency', 3)->default('EUR')->change();
            });
        }
    }
};
