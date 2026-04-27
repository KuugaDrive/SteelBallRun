<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('target_tahunans', function (Blueprint $table) {
            $table->id();
            $table->year('tahun')->unique();

            // Indikator tetap
            $table->unsignedInteger('kekayaan_intelektual')->default(0);         
            $table->unsignedInteger('publikasi_ilmiah_global')->default(0);      
            $table->unsignedInteger('purwarupa')->default(0);                    
            $table->unsignedInteger('kerjasama_internasional')->default(0);      
            $table->unsignedInteger('kerjasama_nasional')->default(0);           
            $table->unsignedBigInteger('dana_eksternal')->default(0);            
            $table->unsignedInteger('sdm_studi_lanjut')->default(0);             
            $table->unsignedInteger('postdoc_visiting')->default(0);             
            $table->unsignedInteger('pelatihan_internasional')->default(0); 

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('target_tahunans');
    }
};