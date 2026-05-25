<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Horário semanal recorrente — uma linha por bloco de disponibilidade
        // num dia da semana (0=Domingo .. 6=Sábado).
        Schema::create('disponibilidades_medico', function (Blueprint $table) {
            $table->id();
            $table->foreignId('medico_id')->constrained('medicos')->cascadeOnDelete();
            $table->unsignedTinyInteger('dia_semana'); // 0..6
            $table->time('hora_inicio');
            $table->time('hora_fim');
            $table->unsignedSmallInteger('duracao_minutos')->default(30);
            $table->foreignId('servico_id')->nullable()->constrained('servicos')->nullOnDelete();
            $table->boolean('ativo')->default(true);
            $table->timestamps();

            $table->index(['medico_id', 'dia_semana']);
        });

        // Ausências / exceções — sobrepõem-se ao horário base.
        Schema::create('ausencias_medico', function (Blueprint $table) {
            $table->id();
            $table->foreignId('medico_id')->constrained('medicos')->cascadeOnDelete();
            $table->dateTime('inicio');
            $table->dateTime('fim');
            $table->string('motivo')->nullable();
            $table->foreignId('criado_por')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['medico_id', 'inicio']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ausencias_medico');
        Schema::dropIfExists('disponibilidades_medico');
    }
};
