<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('usage_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subscription_id')->constrained()->cascadeOnDelete();
            $table->string('event_type');
            $table->unsignedBigInteger('units_consumed')->default(1);
            $table->string('unit_type')->nullable();
            $table->unsignedBigInteger('power_consumed')->default(0);
            $table->string('request_id')->nullable();
            $table->unsignedSmallInteger('agent_response_status')->nullable();
            $table->unsignedInteger('latency_ms')->nullable();
            $table->unsignedBigInteger('cost_cents')->default(0);
            $table->timestamp('recorded_at')->useCurrent();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['subscription_id', 'recorded_at']);
            $table->index('event_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('usage_events');
    }
};
