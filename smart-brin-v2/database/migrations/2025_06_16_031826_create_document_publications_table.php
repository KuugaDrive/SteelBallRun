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
        Schema::create('document_publications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained('documents')->onDelete('cascade');
            $table->string('judul_publikasi');
            $table->string('kelompok_riset');
            $table->string('authors1')->nullable();
            $table->string('authors2')->nullable();
            $table->string('authors3')->nullable();
            $table->string('authors4')->nullable();
            $table->string('authors5')->nullable();
            $table->string('authors6')->nullable();
            $table->string('authors7')->nullable();
            $table->string('nonprsdi_authors')->nullable();
            $table->string('jenis');
            $table->string('status');
            $table->string('status_upload');
            $table->string('nama_jurnal')->nullable();
            $table->boolean('scopus_indexed')->default(false);
            $table->string('reputasi')->nullable();
            $table->string('url')->nullable();
            $table->string('doi')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('document_publications');
    }
};
