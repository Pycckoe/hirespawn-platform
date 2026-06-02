<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Named menus. The `key` is the stable identifier used by views
        // (e.g. 'header_main', 'footer_marketplace', 'footer_legal',
        // 'footer_social', 'footer_payments').
        Schema::create('menus', function (Blueprint $table) {
            $table->id();
            $table->string('key', 60)->unique();
            $table->string('label', 120);
            $table->string('location', 40)->default('footer'); // header|footer|footer_bottom|social|payments
            $table->unsignedInteger('sort')->default(0);
            $table->timestamps();
        });

        Schema::create('menu_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('menu_id')->constrained()->cascadeOnDelete();
            $table->string('label', 120);
            $table->string('url', 500)->nullable();
            // For visual menus: emoji, short text, or a known icon key
            // (visa, mastercard, applepay, googlepay, x, linkedin, github).
            $table->string('icon', 40)->nullable();
            $table->string('target', 10)->default('_self'); // _self | _blank
            $table->unsignedInteger('sort')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['menu_id', 'sort']);
        });

        // Static markdown pages — Terms, Privacy, DPA, AUP, etc.
        Schema::create('pages', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 80)->unique();
            $table->string('title', 200);
            $table->string('meta_title', 200)->nullable();
            $table->string('meta_description', 500)->nullable();
            $table->longText('body')->nullable(); // markdown source
            $table->boolean('is_published')->default(true);
            $table->timestamp('published_at')->nullable();
            $table->timestamps();

            $table->index('is_published');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pages');
        Schema::dropIfExists('menu_items');
        Schema::dropIfExists('menus');
    }
};
