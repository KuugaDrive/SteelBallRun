<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public $withinTransaction = false;

    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql' || !Schema::hasTable('document_extractions')) {
            return;
        }

        DB::transaction(function (): void {
            if (!Schema::hasColumn('document_extractions', 'user_id')) {
                DB::statement('ALTER TABLE document_extractions ADD COLUMN user_id UUID;');
            }

            if (Schema::hasColumn('document_extractions', 'sivitas_id')) {
                DB::statement('ALTER TABLE document_extractions DROP CONSTRAINT IF EXISTS document_extractions_sivitas_id_foreign;');
                DB::statement('DROP INDEX IF EXISTS document_extractions_sivitas_id_index;');
                DB::statement('ALTER TABLE document_extractions DROP COLUMN sivitas_id;');
            }

            DB::statement('ALTER TABLE document_extractions DROP CONSTRAINT IF EXISTS document_extractions_user_id_foreign;');
            DB::statement('ALTER TABLE document_extractions ADD CONSTRAINT document_extractions_user_id_foreign FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;');

            DB::statement('CREATE INDEX IF NOT EXISTS document_extractions_user_id_index ON document_extractions(user_id);');
        });
    }

    public function down(): void
    {
        // Non-destructive rollback.
    }
};
