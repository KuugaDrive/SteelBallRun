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
        Schema::create('document_pks', function (Blueprint $t) {
            $t->id();
            $t->foreignId('document_id')
            ->constrained('documents')->onDelete('cascade');
            $t->string('judul');
            $t->string('kelompok_riset');
            $t->string('pic_prsdi1')->nullable();
            $t->string('pic_prsdi2')->nullable(); 
            $t->string('pic_prsdi3')->nullable(); 
            $t->string('pic_nonprsdi')->nullable();  
            $t->string('tipe');
            $t->string('jenis');
            $t->string('sumber');
            $t->string('output');
            $t->string('pihak_k3')->nullable();
            $t->double('nilai')->nullable();
            $t->text('keterangan')->nullable();
            $t->string('no_kerjasama')->nullable();
            $t->date('tanggal_kerjasama')->nullable();
            $t->string('no_perjanjian')->nullable();
            $t->string('status_upload');
            $t->date('tanggal_perjanjian')->nullable();
            $t->year('tahun_pks')->nullable();
            $t->string('link_bukti_dukung')->nullable();
            $t->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('document_pks');
    }
};
