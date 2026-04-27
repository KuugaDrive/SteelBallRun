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
        Schema::table('document_extractions', function (Blueprint $table): void {
            if (!Schema::hasColumn('document_extractions', 'quartile')) {
                $table->string('quartile', 20)->nullable()->after('issn');
                $table->index('quartile');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('document_extractions', function (Blueprint $table): void {
            if (Schema::hasColumn('document_extractions', 'quartile')) {
                $table->dropIndex(['quartile']);
                $table->dropColumn('quartile');
            }
        });
    }
};

