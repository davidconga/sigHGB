<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Setting extends Model
{
    protected $fillable = ['chave', 'valor', 'descricao'];

    public static function get(string $chave, $default = null)
    {
        return Cache::rememberForever("setting:{$chave}", function () use ($chave, $default) {
            return static::where('chave', $chave)->value('valor') ?? $default;
        });
    }

    public static function set(string $chave, ?string $valor, ?string $descricao = null): void
    {
        static::updateOrCreate(['chave' => $chave], array_filter([
            'valor' => $valor,
            'descricao' => $descricao,
        ], fn ($v) => $v !== null));

        Cache::forget("setting:{$chave}");
    }
}
