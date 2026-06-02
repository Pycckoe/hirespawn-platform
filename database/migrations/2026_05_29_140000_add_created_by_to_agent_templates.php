<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('agent_templates', function (Blueprint $table) {
            // Who created the template. NULL = global / admin-curated (shown
            // to every seller). A seller id = private to that seller (their
            // "Save as template" output), shown only to them in the picker.
            $table->foreignId('created_by_id')->nullable()->after('id')->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('agent_templates', function (Blueprint $table) {
            $table->dropConstrainedForeignId('created_by_id');
        });
    }
};
