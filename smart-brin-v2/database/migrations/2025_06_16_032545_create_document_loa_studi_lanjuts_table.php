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
        Schema::create('document_loa_studi_lanjuts', function (Blueprint $t) {
            $t->id();
            $t->foreignId('document_id')
            ->constrained('documents')->onDelete('cascade');
            $t->string('nama_sdm_iptek');
            $t->string('kelompok_riset');
            $t->string('jenjang_pendidikan');
            $t->string('nama_universitas');
            $t->string('status');
            $t->text('keterangan')->nullable();
            $t->string('status_upload');
            $t->string('upload_dakung')->nullable();
            $t->year('tahun_masuk');
            $t->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('document_loa_studi_lanjuts');
    }
};
