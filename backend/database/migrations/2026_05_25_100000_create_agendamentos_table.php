<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('agendamentos', function (Blueprint $table) {
            $table->id();
            $table->string('numero')->unique();
            $table->foreignId('paciente_id')->constrained('pacientes')->cascadeOnDelete();
            $table->foreignId('medico_id')->nullable()->constrained('medicos')->nullOnDelete();
            $table->foreignId('servico_id')->nullable()->constrained('servicos')->nullOnDelete();
            $table->dateTime('data_agendamento');
            $table->unsignedSmallInteger('duracao_minutos')->default(30);
            $table->text('motivo')->nullable();
            $table->text('observacoes')->nullable();
            $table->enum('status', [
                'pendente', 'confirmada', 'presente',
                'em_atendimento', 'realizada', 'cancelada', 'faltou',
            ])->default('pendente');
            $table->enum('origem', ['recepcao', 'medico', 'paciente_app', 'admin'])->default('recepcao');
            $table->foreignId('consulta_id')->nullable()->constrained('consultas')->nullOnDelete();
            $table->foreignId('criado_por')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('check_in_em')->nullable();
            $table->dateTime('cancelado_em')->nullable();
            $table->string('motivo_cancelamento')->nullable();
            $table->boolean('sms_lembrete_enviado')->default(false);
            $table->timestamps();

            $table->index(['data_agendamento', 'status']);
            $table->index(['medico_id', 'data_agendamento']);
            $table->index(['servico_id', 'data_agendamento']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agendamentos');
    }
};
