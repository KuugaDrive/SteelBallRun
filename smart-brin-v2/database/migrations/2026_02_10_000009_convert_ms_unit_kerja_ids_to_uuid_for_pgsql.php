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
        if (DB::getDriverName() !== 'pgsql' || !Schema::hasTable('ms_unit_kerja')) {
            return;
        }

        if ($this->getColumnUdt('ms_unit_kerja', 'id') === 'uuid') {
            return;
        }

        DB::statement('CREATE EXTENSION IF NOT EXISTS pgcrypto;');

        DB::transaction(function () {
            DB::statement('ALTER TABLE ms_unit_kerja ADD COLUMN IF NOT EXISTS id_uuid UUID;');
            DB::statement('UPDATE ms_unit_kerja SET id_uuid = gen_random_uuid() WHERE id_uuid IS NULL;');
            DB::statement("
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint WHERE conname = 'ms_unit_kerja_id_uuid_unique'
                    ) THEN
                        ALTER TABLE ms_unit_kerja ADD CONSTRAINT ms_unit_kerja_id_uuid_unique UNIQUE (id_uuid);
                    END IF;
                END
                $$;
            ");

            if (Schema::hasTable('users') && Schema::hasColumn('users', 'unit_kerja_id') && $this->getColumnUdt('users', 'unit_kerja_id') !== 'uuid') {
                DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_unit_kerja_id_foreign;');
                DB::statement('ALTER TABLE users ADD COLUMN IF NOT EXISTS unit_kerja_id_uuid UUID;');
                DB::statement('UPDATE users u SET unit_kerja_id_uuid = uk.id_uuid FROM ms_unit_kerja uk WHERE u.unit_kerja_id::text = uk.id::text;');
                DB::statement('ALTER TABLE users DROP COLUMN unit_kerja_id;');
                DB::statement('ALTER TABLE users RENAME COLUMN unit_kerja_id_uuid TO unit_kerja_id;');
                DB::statement('CREATE INDEX IF NOT EXISTS users_unit_kerja_id_index ON users(unit_kerja_id);');
            }

            if (Schema::hasTable('ms_kelompok_riset') && Schema::hasColumn('ms_kelompok_riset', 'unit_kerja_id') && $this->getColumnUdt('ms_kelompok_riset', 'unit_kerja_id') !== 'uuid') {
                DB::statement('ALTER TABLE ms_kelompok_riset DROP CONSTRAINT IF EXISTS ms_kelompok_riset_unit_kerja_id_foreign;');
                DB::statement('ALTER TABLE ms_kelompok_riset ADD COLUMN IF NOT EXISTS unit_kerja_id_uuid UUID;');
                DB::statement('UPDATE ms_kelompok_riset kr SET unit_kerja_id_uuid = uk.id_uuid FROM ms_unit_kerja uk WHERE kr.unit_kerja_id::text = uk.id::text;');
                DB::statement('ALTER TABLE ms_kelompok_riset DROP COLUMN unit_kerja_id;');
                DB::statement('ALTER TABLE ms_kelompok_riset RENAME COLUMN unit_kerja_id_uuid TO unit_kerja_id;');
                DB::statement('ALTER TABLE ms_kelompok_riset ALTER COLUMN unit_kerja_id SET NOT NULL;');
                DB::statement('CREATE INDEX IF NOT EXISTS ms_kelompok_riset_unit_kerja_id_index ON ms_kelompok_riset(unit_kerja_id);');
            }

            DB::statement('ALTER TABLE ms_unit_kerja DROP CONSTRAINT IF EXISTS ms_unit_kerja_pkey;');
            DB::statement('ALTER TABLE ms_unit_kerja DROP COLUMN id;');
            DB::statement('ALTER TABLE ms_unit_kerja RENAME COLUMN id_uuid TO id;');
            DB::statement('ALTER TABLE ms_unit_kerja ADD CONSTRAINT ms_unit_kerja_pkey PRIMARY KEY (id);');

            if (Schema::hasTable('users') && Schema::hasColumn('users', 'unit_kerja_id')) {
                DB::statement("
                    DO $$
                    BEGIN
                        IF NOT EXISTS (
                            SELECT 1 FROM pg_constraint WHERE conname = 'users_unit_kerja_id_foreign'
                        ) THEN
                            ALTER TABLE users
                            ADD CONSTRAINT users_unit_kerja_id_foreign
                            FOREIGN KEY (unit_kerja_id) REFERENCES ms_unit_kerja(id) ON DELETE SET NULL;
                        END IF;
                    END
                    $$;
                ");
            }

            if (Schema::hasTable('ms_kelompok_riset') && Schema::hasColumn('ms_kelompok_riset', 'unit_kerja_id')) {
                DB::statement("
                    DO $$
                    BEGIN
                        IF NOT EXISTS (
                            SELECT 1 FROM pg_constraint WHERE conname = 'ms_kelompok_riset_unit_kerja_id_foreign'
                        ) THEN
                            ALTER TABLE ms_kelompok_riset
                            ADD CONSTRAINT ms_kelompok_riset_unit_kerja_id_foreign
                            FOREIGN KEY (unit_kerja_id) REFERENCES ms_unit_kerja(id) ON DELETE CASCADE;
                        END IF;
                    END
                    $$;
                ");
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Non-destructive rollback: converting UUID back to bigint is not safe.
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
};
