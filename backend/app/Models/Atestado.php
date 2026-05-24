<?php

namespace App\Models;

use App\Models\Concerns\GeraNumeroEVerificacao;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Atestado extends Model
{
    use GeraNumeroEVerificacao;

    protected $table = 'atestados';

    protected $fillable = [
        'paciente_id', 'medico_id', 'tipo', 'data_emissao',
        'data_inicio_repouso', 'data_fim_repouso', 'dias_repouso',
        'diagnostico', 'cid', 'motivo', 'destino', 'observacoes', 'status',
    ];

    protected $casts = [
        'data_emissao' => 'date',
        'data_inicio_repouso' => 'date',
        'data_fim_repouso' => 'date',
    ];

    protected static function numeroPrefix(): string
    {
        return 'AT';
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
