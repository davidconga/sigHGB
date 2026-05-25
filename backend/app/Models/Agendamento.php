<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Agendamento extends Model
{
    protected $table = 'agendamentos';

    protected $fillable = [
        'numero', 'paciente_id', 'medico_id',
        'data_agendamento', 'duracao_minutos', 'motivo', 'observacoes',
        'status', 'origem', 'consulta_id', 'criado_por',
        'check_in_em', 'cancelado_em', 'motivo_cancelamento',
        'sms_lembrete_enviado',
    ];

    protected $casts = [
        'data_agendamento'     => 'datetime',
        'check_in_em'          => 'datetime',
        'cancelado_em'         => 'datetime',
        'sms_lembrete_enviado' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::creating(function (Agendamento $a) {
            if (empty($a->numero)) {
                $year = now()->year;
                $count = static::whereYear('created_at', $year)->count() + 1;
                $a->numero = sprintf('AG-%d-%05d', $year, $count);
            }
        });
    }

    public function paciente(): BelongsTo
    {
        return $this->belongsTo(Paciente::class);
    }

    public function medico(): BelongsTo
    {
        return $this->belongsTo(Medico::class);
    }

    public function consulta(): BelongsTo
    {
        return $this->belongsTo(Consulta::class);
    }

    public function criadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'criado_por');
    }

    public function scopeDoDia(Builder $q, ?string $data = null): Builder
    {
        return $q->whereDate('data_agendamento', $data ?? now()->toDateString());
    }

    public function scopeAtivos(Builder $q): Builder
    {
        return $q->whereNotIn('status', ['cancelada', 'realizada', 'faltou']);
    }

    public function scopeNaFila(Builder $q): Builder
    {
        return $q->whereIn('status', ['presente', 'em_atendimento']);
    }
}
