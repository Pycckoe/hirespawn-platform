<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('agents', function (Blueprint $table) {
            // Vendor opt-in: does this agent use a buyer-supplied knowledge
            // base (RAG)? When true, the buyer gets an upload UI on the
            // configure page and relevant chunks are injected into the
            // system prompt at run time.
            $table->boolean('accepts_knowledge')->default(false)->after('system_prompt');
            // Vendor guidance appended before the retrieved snippets, e.g.
            // "Answer strictly from the knowledge base; cite the section."
            $table->text('knowledge_instructions')->nullable()->after('accepts_knowledge');
        });
    }

    public function down(): void
    {
        Schema::table('agents', function (Blueprint $table) {
            $table->dropColumn(['accepts_knowledge', 'knowledge_instructions']);
        });
    }
};
