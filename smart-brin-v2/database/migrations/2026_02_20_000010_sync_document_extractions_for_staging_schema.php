<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public $withinTransaction = false;

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql' || !Schema::hasTable('document_extractions')) {
            return;
        }

        DB::statement('CREATE EXTENSION IF NOT EXISTS pgcrypto;');

        DB::transaction(function () {
            if (Schema::hasColumn('document_extractions', 'document_id')) {
                DB::statement('ALTER TABLE document_extractions DROP CONSTRAINT IF EXISTS document_extractions_document_id_foreign;');
                DB::statement('ALTER TABLE document_extractions DROP COLUMN document_id;');
            }

            if (Schema::hasColumn('document_extractions', 'confidence_score')) {
                DB::statement('ALTER TABLE document_extractions DROP COLUMN confidence_score;');
            }

            if (!Schema::hasColumn('document_extractions', 'raw_author_list')) {
                DB::statement('ALTER TABLE document_extractions ADD COLUMN raw_author_list JSONB;');
            }

            if (!Schema::hasColumn('document_extractions', 'pub_type')) {
                DB::statement('ALTER TABLE document_extractions ADD COLUMN pub_type VARCHAR(50);');
            }

            if (!Schema::hasColumn('document_extractions', 'publisher')) {
                DB::statement('ALTER TABLE document_extractions ADD COLUMN publisher VARCHAR(255);');
            }

            if (!Schema::hasColumn('document_extractions', 'author_role')) {
                DB::statement('ALTER TABLE document_extractions ADD COLUMN author_role VARCHAR(50);');
            }

            if (!Schema::hasColumn('document_extractions', 'author_order')) {
                DB::statement('ALTER TABLE document_extractions ADD COLUMN author_order INTEGER;');
            }

            DB::statement("ALTER TABLE document_extractions ALTER COLUMN status_mapping TYPE VARCHAR(20) USING status_mapping::text;");
            DB::statement("ALTER TABLE document_extractions ALTER COLUMN status_mapping SET DEFAULT 'unmapped';");

            if ($this->getColumnUdt('document_extractions', 'id') !== 'uuid') {
                DB::statement('ALTER TABLE document_extractions ADD COLUMN IF NOT EXISTS id_uuid UUID;');
                DB::statement('UPDATE document_extractions SET id_uuid = gen_random_uuid() WHERE id_uuid IS NULL;');
                DB::statement('ALTER TABLE document_extractions DROP CONSTRAINT IF EXISTS document_extractions_pkey;');
                DB::statement('ALTER TABLE document_extractions DROP COLUMN id;');
                DB::statement('ALTER TABLE document_extractions RENAME COLUMN id_uuid TO id;');
                DB::statement('ALTER TABLE document_extractions ADD CONSTRAINT document_extractions_pkey PRIMARY KEY (id);');
            }

            if (!Schema::hasColumn('document_extractions', 'user_id')) {
                DB::statement('ALTER TABLE document_extractions ADD COLUMN user_id UUID;');
            }

            if (Schema::hasColumn('document_extractions', 'sivitas_id')) {
                DB::statement('ALTER TABLE document_extractions DROP CONSTRAINT IF EXISTS document_extractions_sivitas_id_foreign;');
                DB::statement('DROP INDEX IF EXISTS document_extractions_sivitas_id_index;');
                DB::statement('ALTER TABLE document_extractions DROP COLUMN sivitas_id;');
            }

            if (!$this->hasConstraint('document_extractions_user_id_foreign')) {
                DB::statement('ALTER TABLE document_extractions ADD CONSTRAINT document_extractions_user_id_foreign FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;');
            }

            DB::statement('CREATE INDEX IF NOT EXISTS document_extractions_user_id_index ON document_extractions(user_id);');
            DB::statement('CREATE INDEX IF NOT EXISTS document_extractions_publication_year_index ON document_extractions(publication_year);');
            DB::statement('CREATE INDEX IF NOT EXISTS document_extractions_status_mapping_index ON document_extractions(status_mapping);');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Non-destructive rollback.
    }

    private function getColumnUdt(string $table, string $column): ?string
    {
        $row = DB::selectOne(
            "SELECT udt_name
             FROM information_schema.columns
             WHERE table_schema = current_schema()
               AND table_name = ?
               AND column_name = ?
             LIMIT 1",
            [$table, $column]
        );

        return $row?->udt_name ?? null;
    }

    private function hasConstraint(string $constraintName): bool
    {
        $row = DB::selectOne(
            "SELECT 1
             FROM pg_constraint
             WHERE conname = ?
             LIMIT 1",
            [$constraintName]
        );

        return $row !== null;
    }
};
