<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Medico extends Model
{
    protected $table = 'medicos';

    protected $fillable = [
        'nome', 'numero_ordem', 'especialidade', 'telefone', 'email',
        'assinatura_path', 'carimbo_path', 'ativo',
    ];

    protected $casts = [
        'ativo' => 'boolean',
    ];

    protected $appends = ['assinatura_url', 'carimbo_url'];

    protected function assinaturaUrl(): Attribute
    {
        return Attribute::get(fn () => $this->assinatura_path ? asset(Storage::url($this->assinatura_path)) : null);
    }

    protected function carimboUrl(): Attribute
    {
        return Attribute::get(fn () => $this->carimbo_path ? asset(Storage::url($this->carimbo_path)) : null);
    }

    public function consultas(): HasMany
    {
        return $this->hasMany(Consulta::class);
    }

    public function exames(): HasMany
    {
        return $this->hasMany(Exame::class);
    }

    public function atestados(): HasMany
    {
        return $this->hasMany(Atestado::class);
    }

    public function altas(): HasMany
    {
        return $this->hasMany(Alta::class);
    }
}
