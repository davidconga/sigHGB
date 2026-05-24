<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Funcionario extends Model
{
    protected $table = 'funcionarios';

    protected $fillable = [
        'nome', 'telefone', 'sexo', 'email', 'data_nascimento',
        'departamento_id', 'servico_id',
        'servico', 'categoria',
        'chefe_departamento', 'chefe_servico', 'ativo', 'receber_aniversario',
    ];

    public function departamento()
    {
        return $this->belongsTo(Departamento::class);
    }

    public function servicoRel()
    {
        return $this->belongsTo(Servico::class, 'servico_id');
    }

    protected $casts = [
        'data_nascimento' => 'date',
        'chefe_departamento' => 'boolean',
        'chefe_servico' => 'boolean',
        'ativo' => 'boolean',
        'receber_aniversario' => 'boolean',
    ];

    public function scopeAniversariantesHoje(Builder $q): Builder
    {
        return $q->whereNotNull('data_nascimento')
            ->whereNotNull('telefone')
            ->where('ativo', true)
            ->where('receber_aniversario', true)
            ->whereRaw("strftime('%m-%d', data_nascimento) = strftime('%m-%d', date('now', 'localtime'))");
    }
}
