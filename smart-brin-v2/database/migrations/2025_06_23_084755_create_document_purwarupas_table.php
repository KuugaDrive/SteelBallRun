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
        Schema::create('document_purwarupas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')
                  ->constrained('documents')
                  ->onDelete('cascade');
            $table->string('judul_purwarupa');
            $table->string('kelompok_riset');
            $table->string('inventor1')->nullable();
            $table->string('inventor2')->nullable();
            $table->string('inventor3')->nullable();
            $table->string('inventor4')->nullable();
            $table->string('inventor5')->nullable();
            $table->text('non_sivitas_prsdi')->nullable();
            $table->string('jenis');
            $table->string('status');
            $table->string('status_upload');
            $table->string('nama_mitra');
            $table->string('link')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('document_purwarupas');
    }
};
