<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('funcionarios', function (Blueprint $table) {
            $table->id();
            $table->string('nome');
            $table->string('telefone', 30);
            $table->enum('sexo', ['M', 'F'])->nullable();
            $table->string('email')->nullable();
            $table->date('data_nascimento')->nullable()->index();
            $table->string('servico')->nullable();
            $table->string('categoria')->nullable();
            $table->boolean('chefe_departamento')->default(false);
            $table->boolean('chefe_servico')->default(false);
            $table->boolean('ativo')->default(true);
            $table->boolean('receber_aniversario')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('funcionarios');
    }
};
