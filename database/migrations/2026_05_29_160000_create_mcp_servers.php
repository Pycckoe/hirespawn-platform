<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Admin-managed catalog of well-known MCP servers (CRM, ticketing,
        // accounting, docs, …). Buyers pick one on the configure page to
        // prefill the "Add MCP server" form. The exact endpoint URL often
        // depends on the buyer's instance/gateway, so `url` may be blank
        // with guidance in `setup_hint`; admins fill in stable URLs over
        // time without a deploy.
        Schema::create('mcp_servers', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->string('icon', 16)->nullable();
            $table->string('category', 60)->default('Other'); // CRM, Support, Finance, …
            $table->text('summary')->nullable();
            $table->string('url', 500)->nullable();            // prefilled endpoint, if stable
            $table->string('auth_type', 20)->default('bearer'); // none | bearer
            $table->text('setup_hint')->nullable();            // where to get the URL + token
            $table->string('docs_url', 500)->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['is_active', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mcp_servers');
    }
};
