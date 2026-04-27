<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql' || !Schema::hasTable('document_extractions')) {
            return;
        }

        if (!Schema::hasColumn('document_extractions', 'user_id')) {
            return;
        }

        $nullCount = DB::table('document_extractions')->whereNull('user_id')->count();
        if ($nullCount > 0) {
            return;
        }

        DB::statement('ALTER TABLE document_extractions ALTER COLUMN user_id SET NOT NULL;');
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql' || !Schema::hasTable('document_extractions') || !Schema::hasColumn('document_extractions', 'user_id')) {
            return;
        }

        DB::statement('ALTER TABLE document_extractions ALTER COLUMN user_id DROP NOT NULL;');
    }
};
