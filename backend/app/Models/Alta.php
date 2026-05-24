<?php

namespace App\Models;

use App\Models\Concerns\GeraNumeroEVerificacao;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Alta extends Model
{
    use GeraNumeroEVerificacao;

    protected $table = 'altas';

    protected $fillable = [
        'paciente_id', 'medico_id', 'data_internamento', 'data_alta',
        'servico', 'cama', 'diagnostico_admissao', 'diagnostico_alta',
        'cid', 'procedimentos', 'evolucao', 'medicacao_alta',
        'recomendacoes', 'condicao_alta', 'status',
    ];

    protected $casts = [
        'data_internamento' => 'date',
        'data_alta' => 'date',
    ];

    protected static function numeroPrefix(): string
    {
        return 'AL';
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
