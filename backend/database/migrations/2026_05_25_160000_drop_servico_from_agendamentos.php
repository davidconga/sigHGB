<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * O conceito "servico" no modulo de marcacao estava a reutilizar a
     * tabela `servicos` que pertence ao modulo de Funcionarios/RH
     * (Departamento/Servico organizacional do hospital) — nao tem
     * relacao com o tipo de consulta. A especialidade do medico ja
     * cobre essa informacao.
     */
    public function up(): void
    {
        Schema::table('agendamentos', function (Blueprint $table) {
            $table->dropForeign(['servico_id']);
            $table->dropIndex(['servico_id', 'data_agendamento']);
            $table->dropColumn('servico_id');
        });

        Schema::table('disponibilidades_medico', function (Blueprint $table) {
            $table->dropForeign(['servico_id']);
            $table->dropColumn('servico_id');
        });
    }

    public function down(): void
    {
        Schema::table('agendamentos', function (Blueprint $table) {
            $table->foreignId('servico_id')->nullable()->after('medico_id')->constrained('servicos')->nullOnDelete();
            $table->index(['servico_id', 'data_agendamento']);
        });

        Schema::table('disponibilidades_medico', function (Blueprint $table) {
            $table->foreignId('servico_id')->nullable()->after('duracao_minutos')->constrained('servicos')->nullOnDelete();
        });
    }
};
