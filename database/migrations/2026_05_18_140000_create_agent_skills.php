<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // One row per tool the agent exposes to the LLM. The LLM reads
        // (name, description, parameters_schema) verbatim when deciding
        // which tool to call; we then dispatch via `transport` to either
        // the vendor's webhook or a built-in handler (v2 will add the
        // 'oauth_proxy' transport for direct provider calls on behalf
        // of the client).
        Schema::create('agent_skills', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agent_id')->constrained()->cascadeOnDelete();
            $table->string('name', 60);                       // send_email, create_lead
            $table->string('label', 120)->nullable();         // "Send email" (admin display)
            $table->text('description');                       // LLM reads this verbatim
            $table->json('parameters_schema')->nullable();     // JSON Schema for the args
            $table->string('transport', 20)->default('webhook'); // webhook|builtin|oauth_proxy
            $table->string('webhook_url', 500)->nullable();    // POST target on the vendor's side
            $table->string('builtin_handler', 60)->nullable(); // key into a server-side dispatch map
            $table->string('required_oauth_provider', 30)->nullable(); // future v2 use
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->unsignedInteger('timeout_seconds')->default(30);
            $table->timestamps();

            $table->unique(['agent_id', 'name']);
            $table->index(['agent_id', 'is_active']);
        });

        // agents.webhook_secret already exists from the original create
        // migration. We populate it lazily — first skill save generates
        // a fresh random secret; vendor can rotate from the edit form.
    }

    public function down(): void
    {
        Schema::dropIfExists('agent_skills');
    }
};
