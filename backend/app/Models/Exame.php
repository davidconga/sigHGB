<?php

namespace App\Models;

use App\Models\Concerns\GeraNumeroEVerificacao;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Exame extends Model
{
    use GeraNumeroEVerificacao;

    protected $table = 'exames';

    protected $fillable = [
        'paciente_id', 'medico_id', 'data_realizacao', 'tipo_exame',
        'material', 'parametros', 'resultado', 'interpretacao',
        'observacoes', 'status',
    ];

    protected $casts = [
        'data_realizacao' => 'date',
        'parametros' => 'array',
    ];

    protected static function numeroPrefix(): string
    {
        return 'EX';
    }

    public function paciente(): BelongsTo
    {
        return $this->belongsTo(Paciente::class);
    }

    public function medico(): BelongsTo
    {
        return $this->belongsTo(Medico::class);
    }
}
