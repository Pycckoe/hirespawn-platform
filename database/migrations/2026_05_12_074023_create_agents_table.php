<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('agents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('seller_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('category_id')->nullable()->constrained('agent_categories')->nullOnDelete();
            $table->string('slug')->unique();
            $table->string('name');
            $table->string('tagline')->nullable();
            $table->text('description')->nullable();
            $table->string('vendor')->nullable();
            $table->string('rank', 8)->nullable();
            $table->string('role')->nullable();
            $table->string('status')->default('draft');
            $table->string('pricing_model')->default('subscription');
            $table->unsignedBigInteger('base_price_cents')->default(0);
            $table->string('currency', 3)->default('EUR');
            $table->string('billing_period')->default('monthly');
            $table->unsignedInteger('power_cost')->default(0);
            $table->string('per_unit')->nullable();
            $table->string('api_endpoint_url')->nullable();
            $table->string('manifest_url')->nullable();
            $table->string('manifest_version')->nullable();
            $table->string('webhook_secret')->nullable();
            $table->string('health_check_url')->nullable();
            $table->decimal('sla_uptime_pct', 5, 2)->default(99.0);
            $table->decimal('rating_avg', 3, 2)->default(0);
            $table->unsignedInteger('reviews_count')->default(0);
            $table->unsignedInteger('subscribers_count')->default(0);
            $table->json('languages')->nullable();
            $table->json('integrations')->nullable();
            $table->string('spec')->nullable();
            $table->boolean('is_featured')->default(false);
            $table->timestamp('featured_until')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'rating_avg']);
            $table->index('category_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agents');
    }
};
