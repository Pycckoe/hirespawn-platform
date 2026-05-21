<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Variable defs the vendor declares per agent (tone, signature,
        // daily cap, target persona, …). Each buyer picks values when
        // they subscribe; values are stored on subscriptions.settings.
        // The LLM gateway substitutes {{key}} → value into system_prompt
        // at invocation time.
        Schema::create('agent_setting_defs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agent_id')->constrained()->cascadeOnDelete();
            $table->string('key', 60);                          // snake_case
            $table->string('label', 120);                       // shown to buyer
            $table->string('type', 20)->default('text');        // text|textarea|select|number|boolean
            $table->text('default_value')->nullable();          // string-coerced; JSON-decoded for arrays/bools
            $table->json('options')->nullable();                // for type=select
            $table->boolean('is_required')->default(false);
            $table->text('description')->nullable();            // hint shown under the input
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['agent_id', 'key']);
            $table->index(['agent_id', 'sort_order']);
        });

        Schema::table('subscriptions', function (Blueprint $table) {
            // Per-subscription values for the vendor's setting defs.
            // Keyed by setting key; values are scalars (or arrays for
            // future multi-select support). Null until buyer configures.
            $table->json('settings')->nullable()->after('cancelled_at');
        });
    }

    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropColumn('settings');
        });
        Schema::dropIfExists('agent_setting_defs');
    }
};
