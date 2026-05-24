<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('funcionarios', function (Blueprint $table) {
            $table->string('telefone', 30)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('funcionarios', function (Blueprint $table) {
            $table->string('telefone', 30)->nullable(false)->change();
        });
    }
};
