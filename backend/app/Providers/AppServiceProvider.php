<?php

namespace App\Providers;

use App\Models\Atestado;
use App\Models\Relatorio;
use App\Observers\AtestadoObserver;
use App\Observers\RelatorioObserver;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Atestado::observe(AtestadoObserver::class);
        Relatorio::observe(RelatorioObserver::class);
    }
}
