<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Admin-managed starting points for the seller "publish agent" flow.
        // A template pre-fills the publish form (identity, prompt, pricing,
        // variables, skills, knowledge) so a seller can spin up a listing in
        // a couple of clicks instead of from a blank page.
        Schema::create('agent_templates', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');                       // template name in the gallery
            $table->string('icon', 16)->nullable();       // emoji/char for the card
            $table->text('summary')->nullable();          // one-liner shown on the card
            $table->string('category_slug')->nullable();  // maps to agent_categories.slug

            // Prefill payload (mirrors the publish form fields).
            $table->string('agent_name')->nullable();     // suggested agent name
            $table->string('role')->nullable();
            $table->string('rank', 8)->nullable();
            $table->string('tagline', 160)->nullable();
            $table->text('description')->nullable();
            $table->text('system_prompt')->nullable();
            $table->string('per_unit', 60)->nullable();
            $table->unsignedInteger('power_cost')->default(10);
            $table->unsignedInteger('est_input_tokens')->default(800);
            $table->unsignedInteger('est_output_tokens')->default(400);
            $table->string('suggested_model_slug', 80)->nullable(); // resolved to llm_model_id if active
            $table->json('languages')->nullable();
            $table->json('integrations')->nullable();

            $table->boolean('accepts_knowledge')->default(false);
            $table->text('knowledge_instructions')->nullable();

            // Arrays of objects matching the publish form's skill / setting-def
            // shapes (see VendorPublishController).
            $table->json('skills')->nullable();
            $table->json('setting_defs')->nullable();

            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['is_active', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agent_templates');
    }
};
