<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public $withinTransaction = false;

    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql' || !Schema::hasTable('users')) {
            return;
        }

        DB::transaction(function (): void {
            if ($this->getColumnUdt('users', 'research_group') !== 'uuid') {
                DB::statement('ALTER TABLE users ADD COLUMN IF NOT EXISTS research_group_uuid UUID;');

                if (Schema::hasTable('ms_kelompok_riset')) {
                    DB::statement("
                        UPDATE users u
                        SET research_group_uuid = kr.id
                        FROM ms_kelompok_riset kr
                        WHERE u.research_group IS NOT NULL
                          AND u.research_group_uuid IS NULL
                          AND LOWER(TRIM(u.research_group::text)) = LOWER(TRIM(kr.kelompok_riset))
                          AND (u.unit_kerja_id IS NULL OR kr.unit_kerja_id = u.unit_kerja_id)
                    ");
                }

                DB::statement('ALTER TABLE users DROP COLUMN research_group;');
                DB::statement('ALTER TABLE users RENAME COLUMN research_group_uuid TO research_group;');
            }

            if (!$this->hasConstraint('users_research_group_foreign') && Schema::hasTable('ms_kelompok_riset')) {
                DB::statement('ALTER TABLE users ADD CONSTRAINT users_research_group_foreign FOREIGN KEY (research_group) REFERENCES ms_kelompok_riset(id) ON DELETE SET NULL;');
            }

            DB::statement('CREATE INDEX IF NOT EXISTS users_research_group_index ON users(research_group);');
        });
    }

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
