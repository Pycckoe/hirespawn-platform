<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Per-deployment connections to remote MCP (Model Context Protocol)
        // servers the buyer wants their agent to use. Only remote HTTP
        // ("Streamable HTTP") servers are supported — stdio servers need a
        // local process, which isn't possible on our hosting. At run time
        // the gateway lists each server's tools and exposes them to the LLM.
        Schema::create('mcp_connections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subscription_id')->constrained()->cascadeOnDelete();
            $table->string('label');
            $table->string('url', 500);                  // the MCP endpoint URL
            $table->string('auth_type', 20)->default('none'); // none | bearer
            $table->text('encrypted_token')->nullable();  // bearer token (Crypt)
            $table->boolean('is_active')->default(true);
            $table->string('status', 20)->default('unknown'); // unknown | ok | failed
            $table->text('status_message')->nullable();
            $table->unsignedInteger('tool_count')->default(0);
            $table->json('tools_cache')->nullable();       // last-seen [{name,description}]
            $table->timestamp('checked_at')->nullable();
            $table->timestamps();

            $table->index(['subscription_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mcp_connections');
    }
};
