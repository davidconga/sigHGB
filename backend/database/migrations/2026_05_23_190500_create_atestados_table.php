<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('atestados', function (Blueprint $table) {
            $table->id();
            $table->string('numero')->unique();
            $table->foreignId('paciente_id')->constrained('pacientes')->cascadeOnDelete();
            $table->foreignId('medico_id')->constrained('medicos')->cascadeOnDelete();
            $table->enum('tipo', ['repouso', 'comparecimento', 'aptidao', 'outros'])->default('repouso');
            $table->date('data_emissao');
            $table->date('data_inicio_repouso')->nullable();
            $table->date('data_fim_repouso')->nullable();
            $table->unsignedInteger('dias_repouso')->nullable();
            $table->text('diagnostico')->nullable();
            $table->string('cid', 10)->nullable();
            $table->text('motivo')->nullable();
            $table->string('destino')->nullable();
            $table->text('observacoes')->nullable();
            $table->enum('status', ['rascunho', 'emitido', 'anulado'])->default('rascunho');
            $table->string('codigo_verificacao', 10)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('atestados');
    }
};
