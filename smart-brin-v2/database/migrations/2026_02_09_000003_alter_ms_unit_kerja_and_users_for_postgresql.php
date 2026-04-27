<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('ms_unit_kerja', function (Blueprint $table) {
            if (!Schema::hasColumn('ms_unit_kerja', 'organisasi_riset_id')) {
                $table->uuid('organisasi_riset_id')->nullable();
            }
        });

        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'unit_kerja_id')) {
                $table->uuid('unit_kerja_id')->nullable();
            }

            if (!Schema::hasColumn('users', 'fungsional')) {
                $table->enum('fungsional', ['utama', 'madya', 'muda', 'pertama'])->nullable();
            }
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement("
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1
                        FROM pg_constraint
                        WHERE conname = 'ms_unit_kerja_organisasi_riset_id_foreign'
                    ) THEN
                        ALTER TABLE ms_unit_kerja
                        ADD CONSTRAINT ms_unit_kerja_organisasi_riset_id_foreign
                        FOREIGN KEY (organisasi_riset_id)
                        REFERENCES ms_organisasi_riset(id)
                        ON DELETE SET NULL;
                    END IF;
                END
                $$;
            ");

            DB::statement("
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1
                        FROM pg_constraint
                        WHERE conname = 'users_unit_kerja_id_foreign'
                    ) THEN
                        ALTER TABLE users
                        ADD CONSTRAINT users_unit_kerja_id_foreign
                        FOREIGN KEY (unit_kerja_id)
                        REFERENCES ms_unit_kerja(id)
                        ON DELETE SET NULL;
                    END IF;
                END
                $$;
            ");

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

            DB::statement("ALTER TABLE users ALTER COLUMN role DROP DEFAULT;");
            DB::statement("ALTER TABLE users ALTER COLUMN role TYPE user_role USING role::text::user_role;");
            DB::statement("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'researcher'::user_role;");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'unit_kerja_id')) {
                $table->dropForeign(['unit_kerja_id']);
                $table->dropColumn('unit_kerja_id');
            }

            if (Schema::hasColumn('users', 'fungsional')) {
                $table->dropColumn('fungsional');
            }
        });

        Schema::table('ms_unit_kerja', function (Blueprint $table) {
            if (Schema::hasColumn('ms_unit_kerja', 'organisasi_riset_id')) {
                $table->dropForeign(['organisasi_riset_id']);
                $table->dropColumn('organisasi_riset_id');
            }
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(255);");
            DB::statement("DROP TYPE IF EXISTS user_role;");
        }
    }
};
