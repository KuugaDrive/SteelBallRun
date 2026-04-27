<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasColumn('users', 'fungsional') && ! Schema::hasColumn('users', 'tingkat_fungsional')) {
            $driver = DB::getDriverName();

            if ($driver === 'pgsql') {
                DB::statement('ALTER TABLE users RENAME COLUMN fungsional TO tingkat_fungsional');
            } elseif ($driver === 'mysql') {
                DB::statement('ALTER TABLE users RENAME COLUMN fungsional TO tingkat_fungsional');
            }
        }

        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'jenis_fungsional')) {
                $table->string('jenis_fungsional')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'jenis_fungsional')) {
                $table->dropColumn('jenis_fungsional');
            }
        });

        if (Schema::hasColumn('users', 'tingkat_fungsional') && ! Schema::hasColumn('users', 'fungsional')) {
            $driver = DB::getDriverName();

            if ($driver === 'pgsql') {
                DB::statement('ALTER TABLE users RENAME COLUMN tingkat_fungsional TO fungsional');
            } elseif ($driver === 'mysql') {
                DB::statement('ALTER TABLE users RENAME COLUMN tingkat_fungsional TO fungsional');
            }
        }
    }
};
