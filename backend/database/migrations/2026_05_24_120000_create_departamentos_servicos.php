<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('departamentos', function (Blueprint $table) {
            $table->id();
            $table->string('nome')->unique();
            $table->timestamps();
        });

        Schema::create('servicos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('departamento_id')->constrained('departamentos')->cascadeOnDelete();
            $table->string('nome');
            $table->timestamps();
            $table->unique(['departamento_id', 'nome']);
        });

        Schema::table('funcionarios', function (Blueprint $table) {
            $table->foreignId('departamento_id')->nullable()->after('email')->constrained('departamentos')->nullOnDelete();
            $table->foreignId('servico_id')->nullable()->after('departamento_id')->constrained('servicos')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('funcionarios', function (Blueprint $table) {
            $table->dropConstrainedForeignId('departamento_id');
            $table->dropConstrainedForeignId('servico_id');
        });
        Schema::dropIfExists('servicos');
        Schema::dropIfExists('departamentos');
    }
};
