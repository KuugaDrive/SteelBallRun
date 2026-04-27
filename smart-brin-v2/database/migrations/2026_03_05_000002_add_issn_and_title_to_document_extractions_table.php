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
        Schema::table('document_extractions', function (Blueprint $table) {
            if (!Schema::hasColumn('document_extractions', 'issn')) {
                $table->string('issn', 32)->nullable();
            }

            if (!Schema::hasColumn('document_extractions', 'title')) {
                $table->text('title')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('document_extractions', function (Blueprint $table) {
            if (Schema::hasColumn('document_extractions', 'issn')) {
                $table->dropColumn('issn');
            }

            if (Schema::hasColumn('document_extractions', 'title')) {
                $table->dropColumn('title');
            }
        });
    }
};
