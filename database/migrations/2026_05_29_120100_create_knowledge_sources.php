<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // One row per knowledge item the buyer adds to a deployment: an
        // uploaded file (txt/md/pdf) or pasted text. Ingestion extracts
        // text, splits it into knowledge_chunks, and embeds each chunk.
        Schema::create('knowledge_sources', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subscription_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('source_type', 20)->default('text');  // text | file
            $table->text('raw_text')->nullable();                 // for source_type=text (editable)
            $table->string('original_filename')->nullable();
            $table->string('disk', 40)->nullable();               // storage disk for the file
            $table->string('path', 500)->nullable();              // path on that disk
            $table->string('mime', 120)->nullable();
            $table->unsignedBigInteger('bytes')->default(0);
            $table->string('status', 20)->default('pending');     // pending | ready | failed
            $table->text('error')->nullable();
            $table->unsignedInteger('chunk_count')->default(0);
            $table->unsignedInteger('char_count')->default(0);
            $table->timestamps();

            $table->index(['subscription_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('knowledge_sources');
    }
};
