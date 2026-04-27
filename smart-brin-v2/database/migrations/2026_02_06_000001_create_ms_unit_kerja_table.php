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
        Schema::create('ms_unit_kerja', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('kode_unit', 50)->unique();
            $table->string('nama_unit', 255);
            $table->string('kelompok_riset', 255);
            $table->enum('level', ['Settama', 'Deputi', 'Inspektorat', 'Organisasi Riset', 'Pusat Riset'])->default('Pusat Riset');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ms_unit_kerja');
    }
};
