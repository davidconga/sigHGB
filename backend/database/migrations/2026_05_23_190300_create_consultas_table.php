<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('consultas', function (Blueprint $table) {
            $table->id();
            $table->string('numero')->unique();
            $table->foreignId('paciente_id')->constrained('pacientes')->cascadeOnDelete();
            $table->foreignId('medico_id')->constrained('medicos')->cascadeOnDelete();
            $table->dateTime('data_consulta');
            $table->text('queixa_principal')->nullable();
            $table->text('historia_doenca')->nullable();
            $table->text('exame_fisico')->nullable();
            $table->text('diagnostico');
            $table->string('cid', 10)->nullable();
            $table->text('prescricao')->nullable();
            $table->text('observacoes')->nullable();
            $table->enum('status', ['rascunho', 'emitido', 'anulado'])->default('rascunho');
            $table->string('codigo_verificacao', 10)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consultas');
    }
};
