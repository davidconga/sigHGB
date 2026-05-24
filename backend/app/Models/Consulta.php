<?php

namespace App\Models;

use App\Models\Concerns\GeraNumeroEVerificacao;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Consulta extends Model
{
    use GeraNumeroEVerificacao;

    protected $table = 'consultas';

    protected $fillable = [
        'paciente_id', 'medico_id', 'data_consulta', 'queixa_principal',
        'historia_doenca', 'exame_fisico', 'diagnostico', 'cid',
        'prescricao', 'observacoes', 'status',
    ];

    protected $casts = [
        'data_consulta' => 'datetime',
    ];

    protected static function numeroPrefix(): string
    {
        return 'CN';
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
