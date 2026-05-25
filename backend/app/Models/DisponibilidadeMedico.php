<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DisponibilidadeMedico extends Model
{
    protected $table = 'disponibilidades_medico';

    protected $fillable = [
        'medico_id', 'dia_semana', 'hora_inicio', 'hora_fim',
        'duracao_minutos', 'ativo',
    ];

    protected $casts = [
        'ativo' => 'boolean',
    ];

    public function medico(): BelongsTo
    {
        return $this->belongsTo(Medico::class);
    }
}
