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
        if (DB::getDriverName() !== 'pgsql' || !Schema::hasTable('users')) {
            return;
        }

        if ($this->getColumnUdt('users', 'id') === 'uuid') {
            return;
        }

        DB::statement('CREATE EXTENSION IF NOT EXISTS pgcrypto;');

        DB::transaction(function () {
            DB::statement('ALTER TABLE users ADD COLUMN IF NOT EXISTS id_uuid UUID;');
            DB::statement("UPDATE users SET id_uuid = gen_random_uuid() WHERE id_uuid IS NULL;");
            DB::statement("
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint WHERE conname = 'users_id_uuid_unique'
                    ) THEN
                        ALTER TABLE users ADD CONSTRAINT users_id_uuid_unique UNIQUE (id_uuid);
                    END IF;
                END
                $$;
            ");

            if (Schema::hasTable('documents') && Schema::hasColumn('documents', 'user_id') && $this->getColumnUdt('documents', 'user_id') !== 'uuid') {
                DB::statement('ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_user_id_foreign;');
                DB::statement('ALTER TABLE documents ADD COLUMN IF NOT EXISTS user_id_uuid UUID;');
                DB::statement('UPDATE documents d SET user_id_uuid = u.id_uuid FROM users u WHERE d.user_id::text = u.id::text;');
                DB::statement('ALTER TABLE documents DROP COLUMN user_id;');
                DB::statement('ALTER TABLE documents RENAME COLUMN user_id_uuid TO user_id;');
                DB::statement('ALTER TABLE documents ALTER COLUMN user_id SET NOT NULL;');
                DB::statement('CREATE INDEX IF NOT EXISTS documents_user_id_index ON documents(user_id);');
            }

            if (Schema::hasTable('sessions') && Schema::hasColumn('sessions', 'user_id') && $this->getColumnUdt('sessions', 'user_id') !== 'uuid') {
                DB::statement('ALTER TABLE sessions ADD COLUMN IF NOT EXISTS user_id_uuid UUID;');
                DB::statement('UPDATE sessions s SET user_id_uuid = u.id_uuid FROM users u WHERE s.user_id::text = u.id::text;');
                DB::statement('ALTER TABLE sessions DROP COLUMN user_id;');
                DB::statement('ALTER TABLE sessions RENAME COLUMN user_id_uuid TO user_id;');
                DB::statement('CREATE INDEX IF NOT EXISTS sessions_user_id_index ON sessions(user_id);');
            }

            DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_pkey;');
            DB::statement('ALTER TABLE users DROP COLUMN id;');
            DB::statement('ALTER TABLE users RENAME COLUMN id_uuid TO id;');
            DB::statement('ALTER TABLE users ADD CONSTRAINT users_pkey PRIMARY KEY (id);');

            if (Schema::hasTable('documents') && Schema::hasColumn('documents', 'user_id')) {
                DB::statement("
                    DO $$
                    BEGIN
                        IF NOT EXISTS (
                            SELECT 1 FROM pg_constraint WHERE conname = 'documents_user_id_foreign'
                        ) THEN
                            ALTER TABLE documents
                            ADD CONSTRAINT documents_user_id_foreign
                            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
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
