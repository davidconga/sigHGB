<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('altas', function (Blueprint $table) {
            $table->id();
            $table->string('numero')->unique();
            $table->foreignId('paciente_id')->constrained('pacientes')->cascadeOnDelete();
            $table->foreignId('medico_id')->constrained('medicos')->cascadeOnDelete();
            $table->date('data_internamento');
            $table->date('data_alta');
            $table->string('servico')->nullable();
            $table->string('cama')->nullable();
            $table->text('diagnostico_admissao')->nullable();
            $table->text('diagnostico_alta');
            $table->string('cid', 10)->nullable();
            $table->text('procedimentos')->nullable();
            $table->text('evolucao')->nullable();
            $table->text('medicacao_alta')->nullable();
            $table->text('recomendacoes')->nullable();
            $table->enum('condicao_alta', ['curado', 'melhorado', 'transferido', 'obito', 'desistencia'])->default('melhorado');
            $table->enum('status', ['rascunho', 'emitido', 'anulado'])->default('rascunho');
            $table->string('codigo_verificacao', 10)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('altas');
    }
};
