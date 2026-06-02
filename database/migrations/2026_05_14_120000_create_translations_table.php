<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('translations', function (Blueprint $table) {
            $table->id();
            $table->string('locale', 8);
            $table->string('namespace', 60)->default('site');
            $table->string('key', 160);
            $table->text('value')->nullable();
            $table->string('description', 200)->nullable();
            $table->timestamps();

            $table->unique(['locale', 'namespace', 'key']);
            $table->index(['locale', 'namespace']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('translations');
    }
};
