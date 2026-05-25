<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PortalMarcacaoSession extends Model
{
    use HasUuids;

    protected $table = 'portal_marcacao_sessions';

    protected $fillable = [
        'telefone', 'codigo_hash', 'expira_em', 'verificado_em', 'tentativas',
        'paciente_id', 'paciente_novo', 'marcacao_dados', 'agendamento_id',
        'ip', 'user_agent',
    ];

    protected $casts = [
        'expira_em'      => 'datetime',
        'verificado_em'  => 'datetime',
        'paciente_novo'  => 'array',
        'marcacao_dados' => 'array',
    ];

    public function paciente(): BelongsTo
    {
        return $this->belongsTo(Paciente::class);
    }

    public function agendamento(): BelongsTo
    {
        return $this->belongsTo(Agendamento::class);
    }

    public function isExpirada(): bool
    {
        return $this->expira_em->isPast();
    }
}
