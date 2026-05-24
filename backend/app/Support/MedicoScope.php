<?php

namespace App\Support;

use Illuminate\Database\Eloquent\Builder;

class MedicoScope
{
    /**
     * Restringe a query ao médico do utilizador autenticado se este tiver
     * apenas o role "medico" (admin vê tudo). Útil em controllers de relatórios.
     */
    public static function apply(Builder $query, string $column = 'medico_id'): Builder
    {
        $user = auth()->user();
        if (! $user) return $query;
        if ($user->hasRole('admin')) return $query;
        if ($user->hasRole('medico') && $user->medico_id) {
            return $query->where($column, $user->medico_id);
        }
        return $query;
    }

    /**
     * Verifica se o utilizador autenticado pode aceder ao modelo (que tem medico_id).
     */
    public static function canAccess($model): bool
    {
        $user = auth()->user();
        if (! $user) return false;
        if ($user->hasRole('admin')) return true;
        if ($user->hasRole('medico') && $user->medico_id) {
            return $model->medico_id === $user->medico_id;
        }
        // recepcionista ou outros — leitura permitida pelo middleware
        return true;
    }
}
