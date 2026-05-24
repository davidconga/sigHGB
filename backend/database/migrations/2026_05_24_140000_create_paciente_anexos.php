<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('paciente_anexos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('paciente_id')->constrained('pacientes')->cascadeOnDelete();
            $table->string('tipo', 30)->default('outro'); // bi, prescricao, exame, outro
            $table->string('descricao', 255)->nullable();
            $table->string('path', 500);              // storage path (relative to disk public)
            $table->string('original_name', 255)->nullable();
            $table->string('mime', 100)->nullable();
            $table->unsignedInteger('size')->default(0);
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['paciente_id', 'tipo']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('paciente_anexos');
    }
};
