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
        // 1. Buat tabel document_publications
        Schema::create('document_publications', function (Blueprint $table) {
            // id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
            $table->uuid('id')->primary();

            // document_id BIGINT NULL
            $table->bigInteger('document_id')->nullable();

            // Kolom-kolom data publikasi
            $table->text('judul_publikasi');
            $table->string('pub_type', 100)->nullable();
            $table->string('penerbit_jurnal', 255)->nullable();
            $table->integer('tahun_publikasi')->nullable();
            $table->text('url_resource')->nullable();
            $table->text('inti_penelitian')->nullable();
            $table->text('abstrak')->nullable();

            // created_at & updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            $table->timestamps();
        });

        // 2. Buat tabel publication_authors
        Schema::create('publication_authors', function (Blueprint $table) {
            // id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
            $table->uuid('id')->primary();

            // Foreign keys kolom
            $table->uuid('publication_id');
            $table->uuid('user_id')->nullable();

            // Kolom-kolom data author
            $table->string('nama_penulis', 255);
            $table->integer('urutan_penulis');
            $table->string('peran_penulis', 50)->nullable();
            $table->boolean('is_internal_brin')->default(false);

            // Sesuai SQL Anda yang hanya meminta created_at
            $table->timestamp('created_at')->useCurrent();

            // ==========================================
            // Definisi Relasi (Foreign Keys)
            // ==========================================
            $table->foreign('publication_id')
                ->references('id')
                ->on('document_publications')
                ->onDelete('cascade'); // Jika publikasi dihapus, authornya ikut terhapus

            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('set null'); // Jika user dihapus, nama di publikasi tetap aman (hanya ID-nya yg jadi null)
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Urutan drop harus dibalik (anak dulu, baru induk) agar tidak error foreign key
        Schema::dropIfExists('publication_authors');
        Schema::dropIfExists('document_publications');
    }
};