<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            // Optional uploaded icon (PNG / SVG / WebP). Stored on the
            // 'public' disk; rendered via /storage/{path}. When present,
            // the frontend prefers this over the inline SVG keyed by `icon`.
            $table->string('icon_image', 500)->nullable()->after('icon');
        });
    }

    public function down(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            $table->dropColumn('icon_image');
        });
    }
};
