<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('cids', function (Blueprint $table) {
            $table->string('descricao_en')->nullable()->after('descricao');
        });
    }

    public function down(): void
    {
        Schema::table('cids', function (Blueprint $table) {
            $table->dropColumn('descricao_en');
        });
    }
};
