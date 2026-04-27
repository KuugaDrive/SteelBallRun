    <?php

    use Illuminate\Database\Migrations\Migration;
    use Illuminate\Database\Schema\Blueprint;
    use Illuminate\Support\Facades\Schema;

    return new class extends Migration
    {
        /**
         * Run the migrations.
         */
        public function up(): void
        {
            Schema::create('document_pelatihan_luar_negeris', function (Blueprint $t) {
                $t->id();
                $t->foreignId('document_id')
                ->constrained('documents')->onDelete('cascade');
                $t->string('nama_sdm_prsdi')->nullable();
                $t->string('non_sdm_prsdi')->nullable();
                $t->string('kelompok_riset');
                $t->string('status');
                $t->string('jenis');
                $t->text('keterangan');
                $t->string('status_upload');
                $t->string('upload_dakung')->nullable();
                $t->timestamps();
            });
        }

        /**
         * Reverse the migrations.
         */
        public function down(): void
        {
            Schema::dropIfExists('document_pelatihan_luar_negeris');
        }
    };
