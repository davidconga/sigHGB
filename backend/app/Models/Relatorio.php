<?php

namespace App\Models;

use App\Models\Concerns\GeraNumeroEVerificacao;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Relatorio extends Model
{
    use GeraNumeroEVerificacao;

    protected $table = 'relatorios';

    protected $fillable = [
        'tipo', 'subtitulo', 'paciente_id', 'medico_id', 'data_emissao',
        'historia_doenca', 'exame_objectivo', 'exames_complementares',
        'diagnostico', 'cid', 'tratamento', 'recomendacao', 'motivo',
        'grau_discapacidade', 'causa_morte', 'status',
    ];

    protected $casts = [
        'data_emissao' => 'date',
        'grau_discapacidade' => 'integer',
    ];

    public const TIPOS = [
        'relatorio_medico' => 'Relatório Médico',
        'junta_medica' => 'Relatório Médico (Junta)',
        'fisioterapeutico' => 'Relatório Fisioterapéutico',
        'informacao_clinica' => 'Informação Clínica',
        'nota_alta' => 'Nota de Alta',
        'guia_transferencia' => 'Guia de Transferência',
    ];

    public function getTituloPdfAttribute(): string
    {
        return match ($this->tipo) {
            'fisioterapeutico' => 'RELATÓRIO FISIOTERAPÉUTICO',
            'informacao_clinica' => 'INFORMAÇÃO CLÍNICA',
            'nota_alta' => 'NOTA DE ALTA',
            'guia_transferencia' => 'GUIA DE TRANSFERÊNCIA',
            default => 'RELATÓRIO MÉDICO',
        };
    }

    protected static function numeroPrefix(): string
    {
        return 'RM';
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
