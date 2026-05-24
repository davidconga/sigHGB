<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('pacientes', function (Blueprint $table) {
            $table->string('nome_pai')->nullable()->after('nome');
            $table->string('nome_mae')->nullable()->after('nome_pai');
            $table->string('naturalidade_provincia')->nullable()->after('provincia');
            $table->string('naturalidade_municipio')->nullable()->after('naturalidade_provincia');
            $table->string('bi_emissao_local')->nullable()->after('bi');
            $table->date('bi_emissao_data')->nullable()->after('bi_emissao_local');
        });
    }

    public function down(): void
    {
        Schema::table('pacientes', function (Blueprint $table) {
            $table->dropColumn([
                'nome_pai', 'nome_mae', 'naturalidade_provincia',
                'naturalidade_municipio', 'bi_emissao_local', 'bi_emissao_data',
            ]);
        });
    }
};
