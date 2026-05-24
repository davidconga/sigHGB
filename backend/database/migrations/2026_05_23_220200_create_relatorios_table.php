<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('relatorios', function (Blueprint $table) {
            $table->id();
            $table->string('numero')->unique();
            $table->string('tipo', 40)->default('relatorio_medico');
            $table->string('subtitulo')->nullable();
            $table->foreignId('paciente_id')->constrained('pacientes')->cascadeOnDelete();
            $table->foreignId('medico_id')->constrained('medicos')->cascadeOnDelete();
            $table->date('data_emissao');
            $table->text('historia_doenca');
            $table->text('exame_objectivo')->nullable();
            $table->text('exames_complementares')->nullable();
            $table->text('diagnostico');
            $table->string('cid', 10)->nullable();
            $table->text('tratamento')->nullable();
            $table->text('recomendacao')->nullable();
            $table->text('motivo')->nullable();
            $table->unsignedTinyInteger('grau_discapacidade')->nullable();
            $table->text('causa_morte')->nullable();
            $table->enum('status', ['rascunho', 'emitido', 'anulado'])->default('rascunho');
            $table->string('codigo_verificacao', 10)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('relatorios');
    }
};
