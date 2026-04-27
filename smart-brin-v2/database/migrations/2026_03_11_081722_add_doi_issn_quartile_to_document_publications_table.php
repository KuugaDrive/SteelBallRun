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
        Schema::table('document_publications', function (Blueprint $table) {
            $table->string('status_dokumen', 50)->nullable()->after('pub_type');
            $table->string('doi', 255)->nullable()->after('tahun_publikasi');
            $table->string('issn', 50)->nullable()->after('doi');
            $table->string('quartile', 50)->nullable()->after('issn');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('document_publications', function (Blueprint $table) {
            $table->dropColumn(['status_dokumen', 'doi', 'issn', 'quartile']);
        });
    }
};
