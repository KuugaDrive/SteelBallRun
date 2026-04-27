<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public $withinTransaction = false;

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement("
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_type
                    WHERE typname = 'user_role'
                ) THEN
                    CREATE TYPE user_role AS ENUM ('researcher', 'monev', 'head', 'admin', 'superadmin');
                END IF;
            END
            $$;
        ");

        DB::statement("
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1
                    FROM pg_type
                    WHERE typname = 'user_role'
                ) AND NOT EXISTS (
                    SELECT 1
                    FROM pg_enum e
                    JOIN pg_type t ON t.oid = e.enumtypid
                    WHERE t.typname = 'user_role' AND e.enumlabel = 'admin'
                ) THEN
                    ALTER TYPE user_role ADD VALUE 'admin';
                END IF;
            END
            $$;
        ");

        DB::statement("
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1
                    FROM pg_type
                    WHERE typname = 'user_role'
                ) AND NOT EXISTS (
                    SELECT 1
                    FROM pg_enum e
                    JOIN pg_type t ON t.oid = e.enumtypid
                    WHERE t.typname = 'user_role' AND e.enumlabel = 'superadmin'
                ) THEN
                    ALTER TYPE user_role ADD VALUE 'superadmin';
                END IF;
            END
            $$;
        ");

        DB::statement("
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1
                    FROM pg_constraint c
                    JOIN pg_class t ON t.oid = c.conrelid
                    WHERE c.conname = 'users_role_check'
                      AND t.relname = 'users'
                ) THEN
                    ALTER TABLE users DROP CONSTRAINT users_role_check;
                END IF;
            END
            $$;
        ");

        DB::statement("ALTER TABLE users ALTER COLUMN role DROP DEFAULT;");
        DB::statement("ALTER TABLE users ALTER COLUMN role TYPE user_role USING role::text::user_role;");
        DB::statement("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'researcher'::user_role;");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No-op: this migration only removes stale check constraints on PostgreSQL.
    }
};
