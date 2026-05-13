<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Stablecoin / crypto codes (USDC, USDT, BUSD, etc.) are 3–5 chars,
        // not the strict ISO-4217 3-char limit. Postgres rejected USDC on
        // seed; SQLite locally was lenient. Widen to 8 to leave headroom.
        Schema::table('currencies', function (Blueprint $table) {
            $table->string('code', 8)->change();
        });
    }

    public function down(): void
    {
        Schema::table('currencies', function (Blueprint $table) {
            $table->string('code', 3)->change();
        });
    }
};
