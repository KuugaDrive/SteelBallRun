<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            // Add columns for monev feedback workflow
            $table->text('monev_notes')->nullable(); // Alasan dari monev
            $table->enum('monev_status', ['pending', 'approved', 'rejected', 'needs_revision'])->default('pending'); // Status yang diberikan monev
            $table->timestamp('monev_stamp_locked')->nullable(); // Waktu monev stamp dikunci
            $table->boolean('is_locked_for_monev')->default(false); // Flag apakah doc terkunci karena feedback monev
            $table->timestamp('researcher_resubmitted_at')->nullable(); // Waktu researcher resubmit
            $table->integer('revision_count')->default(0); // Jumlah revisi
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropColumn([
                'monev_notes',
                'monev_status',
                'monev_stamp_locked',
                'is_locked_for_monev',
                'researcher_resubmitted_at',
                'revision_count',
            ]);
        });
    }
};
