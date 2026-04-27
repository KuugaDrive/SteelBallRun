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
        // Jika nama tabel Anda di database adalah 'document_publications' (pakai 's')
        Schema::rename('document_publications', 'document_publications_old');


    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Mengembalikan nama tabel jika kita melakukan rollback
        Schema::rename('document_publications_old', 'document_publications');
    }
};