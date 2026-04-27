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
        Schema::create('document_extractions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->text('raw_title');
            $table->text('raw_authors')->nullable();
            $table->jsonb('raw_author_list')->nullable();
            $table->string('pub_type', 50)->nullable();
            $table->integer('publication_year')->nullable();
            $table->string('publisher', 255)->nullable();
            $table->text('scholar_link')->nullable();
            $table->string('author_role', 50)->nullable();
            $table->integer('author_order')->nullable();
            $table->text('ai_abstract')->nullable();
            $table->text('ai_core_focus')->nullable();
            $table->jsonb('ai_metadata')->nullable();
            $table->string('status_mapping', 20)->default('unmapped');
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->index('user_id');
            $table->index('publication_year');
            $table->index('status_mapping');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('document_extractions');
    }
};
