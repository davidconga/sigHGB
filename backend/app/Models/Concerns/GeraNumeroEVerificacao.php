<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

trait GeraNumeroEVerificacao
{
    public static function bootGeraNumeroEVerificacao(): void
    {
        static::creating(function (Model $m) {
            if (empty($m->numero)) {
                $prefix = static::numeroPrefix();
                $year = now()->year;
                $count = static::whereYear('created_at', $year)->count() + 1;
                $m->numero = sprintf('%s-%d-%05d', $prefix, $year, $count);
            }

            if ($m->status === 'emitido' && empty($m->codigo_verificacao)) {
                $m->codigo_verificacao = strtoupper(Str::random(8));
            }
        });

        static::updating(function (Model $m) {
            if ($m->isDirty('status') && $m->status === 'emitido' && empty($m->codigo_verificacao)) {
                $m->codigo_verificacao = strtoupper(Str::random(8));
            }
        });
    }

    abstract protected static function numeroPrefix(): string;
}
