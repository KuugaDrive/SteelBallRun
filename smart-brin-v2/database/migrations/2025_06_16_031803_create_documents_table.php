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
            Schema::create('documents', function (Blueprint $table) {
                $table->id();
                $table->foreignUuid('user_id')->constrained()->onDelete('cascade');
                $table->string('document_type')->index();
                $table->string('title');
                $table->string('kelompok_riset')->index();
                $table->enum('status', ['submitted', 'pending', 'reviewed', 'revised', 'approved', 'rejected'])->default('submitted')->index();
                $table->text('notes')->nullable();
                $table->timestamp('monev_stamp')->nullable();
                $table->timestamps();
            });
        }

        /**
         * Reverse the migrations.
         */
        public function down(): void
        {
            Schema::dropIfExists('documents');
        }
    };
