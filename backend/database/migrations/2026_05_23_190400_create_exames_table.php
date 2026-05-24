<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('exames', function (Blueprint $table) {
            $table->id();
            $table->string('numero')->unique();
            $table->foreignId('paciente_id')->constrained('pacientes')->cascadeOnDelete();
            $table->foreignId('medico_id')->constrained('medicos')->cascadeOnDelete();
            $table->date('data_realizacao');
            $table->string('tipo_exame');
            $table->text('material')->nullable();
            $table->json('parametros')->nullable();
            $table->text('resultado');
            $table->text('interpretacao')->nullable();
            $table->text('observacoes')->nullable();
            $table->enum('status', ['rascunho', 'emitido', 'anulado'])->default('rascunho');
            $table->string('codigo_verificacao', 10)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exames');
    }
};
