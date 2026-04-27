<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public $withinTransaction = false;

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1
                        FROM pg_type
                        WHERE typname = 'user_role'
                    ) THEN
                        CREATE TYPE user_role AS ENUM ('researcher', 'monev', 'head', 'admin', 'superadmin');
                    ELSIF NOT EXISTS (
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

            DB::statement("ALTER TABLE users ALTER COLUMN role DROP DEFAULT;");
            DB::statement("ALTER TABLE users ALTER COLUMN role TYPE user_role USING role::text::user_role;");
            DB::statement("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'researcher'::user_role;");

            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['researcher', 'monev', 'head', 'admin', 'superadmin'])->default('researcher')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'researcher'::user_role;");
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['researcher', 'monev', 'head', 'admin'])->default('researcher')->change();
        });
    }
};
