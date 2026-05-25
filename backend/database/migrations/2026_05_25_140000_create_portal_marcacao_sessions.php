<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Sessoes temporarias do portal publico — guardam dados em escrow
        // ate o paciente verificar o codigo SMS. Limpa-se periodicamente.
        Schema::create('portal_marcacao_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('telefone', 30);
            $table->string('codigo_hash');                 // hash do codigo 6 digitos
            $table->dateTime('expira_em');
            $table->dateTime('verificado_em')->nullable();
            $table->unsignedSmallInteger('tentativas')->default(0);
            $table->foreignId('paciente_id')->nullable()->constrained('pacientes')->nullOnDelete();
            $table->json('paciente_novo')->nullable();     // dados se for novo
            $table->json('marcacao_dados');                // medico_id, data, motivo, ...
            $table->foreignId('agendamento_id')->nullable()->constrained('agendamentos')->nullOnDelete();
            $table->string('ip', 45)->nullable();
            $table->string('user_agent')->nullable();
            $table->timestamps();

            $table->index('telefone');
            $table->index('expira_em');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('portal_marcacao_sessions');
    }
};
