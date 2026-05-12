<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('buyer_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('subscription_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamp('period_start')->nullable();
            $table->timestamp('period_end')->nullable();
            $table->unsignedBigInteger('subtotal_cents')->default(0);
            $table->unsignedBigInteger('vat_cents')->default(0);
            $table->unsignedBigInteger('total_cents')->default(0);
            $table->string('currency', 3)->default('EUR');
            $table->string('status')->default('pending');
            $table->string('stripe_invoice_id')->nullable();
            $table->string('pdf_url')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('due_at')->nullable();
            $table->timestamps();

            $table->index(['buyer_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
