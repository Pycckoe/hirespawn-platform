<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Public catalogue of LLM models the platform supports. Prices are
        // in € cents per 1M tokens (so an 0.0003 €/token model = 300 cents).
        // Admin tunes these in /admin/llm-models when providers change pricing.
        Schema::create('llm_models', function (Blueprint $table) {
            $table->id();
            $table->string('provider', 30);             // openai, anthropic, google, ...
            $table->string('slug', 80)->unique();       // claude-opus-4-7
            $table->string('name', 120);                // "Claude Opus 4.7"
            $table->string('version', 40)->nullable();  // "20251101"
            $table->string('api_id', 120);              // exact id the provider expects
            $table->unsignedBigInteger('input_price_cents_per_1m')->default(0);
            $table->unsignedBigInteger('output_price_cents_per_1m')->default(0);
            $table->unsignedInteger('context_window')->default(0);
            $table->unsignedInteger('max_output_tokens')->default(0);
            $table->json('capabilities')->nullable();   // ["text","vision","tools","json"]
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('deprecated_at')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['provider', 'is_active']);
        });

        // Seller-level API credentials. One row per (seller, provider) — the
        // same key powers every agent that seller publishes against that
        // provider. Key is encrypted at rest via Laravel's Crypt facade.
        Schema::create('seller_llm_credentials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('seller_id')->constrained('users')->cascadeOnDelete();
            $table->string('provider', 30);
            $table->string('label', 80)->nullable();         // "Acme studio prod"
            $table->text('encrypted_api_key');                // Crypt::encryptString
            $table->string('last4', 8)->nullable();           // for UI display
            $table->timestamp('verified_at')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamps();

            $table->unique(['seller_id', 'provider']);
        });

        Schema::table('agents', function (Blueprint $table) {
            $table->foreignId('llm_model_id')->nullable()->after('category_id')->constrained('llm_models')->nullOnDelete();
            // System prompt the agent ships to the model on every run.
            $table->text('system_prompt')->nullable()->after('description');
            // Seller's own estimate of avg tokens per run — drives the
            // margin calculator in the publish form.
            $table->unsignedInteger('est_input_tokens')->default(0)->after('power_cost');
            $table->unsignedInteger('est_output_tokens')->default(0)->after('est_input_tokens');
            // Optional per-run override of max_output_tokens (caps cost).
            $table->unsignedInteger('max_output_tokens')->nullable()->after('est_output_tokens');
        });

        Schema::table('usage_events', function (Blueprint $table) {
            // Actual tokens consumed on this run (returned by provider).
            $table->unsignedInteger('input_tokens')->nullable()->after('cost_cents');
            $table->unsignedInteger('output_tokens')->nullable()->after('input_tokens');
            // Provider-side cost in € cents (computed from real tokens × model price).
            $table->unsignedInteger('provider_cost_cents')->default(0)->after('output_tokens');
        });
    }

    public function down(): void
    {
        Schema::table('usage_events', function (Blueprint $table) {
            $table->dropColumn(['input_tokens', 'output_tokens', 'provider_cost_cents']);
        });
        Schema::table('agents', function (Blueprint $table) {
            $table->dropForeign(['llm_model_id']);
            $table->dropColumn(['llm_model_id', 'system_prompt', 'est_input_tokens', 'est_output_tokens', 'max_output_tokens']);
        });
        Schema::dropIfExists('seller_llm_credentials');
        Schema::dropIfExists('llm_models');
    }
};
