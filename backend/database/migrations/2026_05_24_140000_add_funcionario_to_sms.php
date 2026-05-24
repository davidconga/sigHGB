<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('sms_messages', function (Blueprint $table) {
            $table->foreignId('funcionario_id')->nullable()->after('paciente_id')
                ->constrained('funcionarios')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('sms_messages', function (Blueprint $table) {
            $table->dropConstrainedForeignId('funcionario_id');
        });
    }
};
