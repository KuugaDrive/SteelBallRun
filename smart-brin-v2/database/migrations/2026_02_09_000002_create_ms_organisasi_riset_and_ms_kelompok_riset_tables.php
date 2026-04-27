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
        Schema::create('ms_organisasi_riset', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('organisasi_riset', 255);
        });

        Schema::create('ms_kelompok_riset', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('unit_kerja_id');
            $table->string('kelompok_riset', 255);

            $table->foreign('unit_kerja_id')
                ->references('id')
                ->on('ms_unit_kerja')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ms_kelompok_riset');
        Schema::dropIfExists('ms_organisasi_riset');
    }
};
