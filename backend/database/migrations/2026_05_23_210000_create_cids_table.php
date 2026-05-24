<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('cids', function (Blueprint $table) {
            $table->id();
            $table->string('codigo', 10)->unique();
            $table->string('descricao');
            $table->string('capitulo')->nullable();
            $table->boolean('ativo')->default(true);
            $table->timestamps();
            $table->index('codigo');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cids');
    }
};
