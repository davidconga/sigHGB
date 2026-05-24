<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Atestados: tornar medico_id opcional + remover FK existente
        Schema::table('atestados', function (Blueprint $table) {
            $table->dropForeign(['medico_id']);
        });
        Schema::table('atestados', function (Blueprint $table) {
            $table->foreignId('medico_id')->nullable()->change()
                ->constrained('medicos')->nullOnDelete();
        });

        // Relatorios: idem
        Schema::table('relatorios', function (Blueprint $table) {
            $table->dropForeign(['medico_id']);
        });
        Schema::table('relatorios', function (Blueprint $table) {
            $table->foreignId('medico_id')->nullable()->change()
                ->constrained('medicos')->nullOnDelete();
        });

        // Limpar fallback: atestados/relatorios importados do legado
        // (foram criados com medico_id=1 por defeito mas o legado não tinha esse campo)
        DB::table('atestados')->where('medico_id', 1)->update(['medico_id' => null]);
    }

    public function down(): void
    {
        Schema::table('atestados', function (Blueprint $table) {
            $table->dropForeign(['medico_id']);
        });
        Schema::table('atestados', function (Blueprint $table) {
            $table->foreignId('medico_id')->nullable(false)->change()->constrained('medicos');
        });
        Schema::table('relatorios', function (Blueprint $table) {
            $table->dropForeign(['medico_id']);
        });
        Schema::table('relatorios', function (Blueprint $table) {
            $table->foreignId('medico_id')->nullable(false)->change()->constrained('medicos');
        });
    }
};
