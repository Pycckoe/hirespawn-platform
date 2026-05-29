<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // A retrievable slice of a knowledge source plus its embedding
        // vector (stored as JSON so we stay portable across sqlite/mysql/
        // pgsql — cosine similarity is computed in PHP at query time,
        // which is fine for a single deployment's knowledge base).
        Schema::create('knowledge_chunks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('knowledge_source_id')->constrained()->cascadeOnDelete();
            // Denormalised for fast per-deployment retrieval scoping.
            $table->foreignId('subscription_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('ordinal')->default(0);
            $table->longText('content');
            $table->unsignedInteger('token_estimate')->default(0);
            $table->json('embedding')->nullable();
            $table->string('embedding_model', 80)->nullable();
            $table->timestamps();

            $table->index('subscription_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('knowledge_chunks');
    }
};
