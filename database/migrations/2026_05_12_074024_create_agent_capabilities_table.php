<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('agent_capabilities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agent_id')->constrained()->cascadeOnDelete();
            $table->string('capability_key');
            $table->string('capability_value');
            $table->timestamps();

            $table->index(['agent_id', 'capability_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agent_capabilities');
    }
};
