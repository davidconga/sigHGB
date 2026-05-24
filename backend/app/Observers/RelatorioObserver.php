<?php

namespace App\Observers;

use App\Models\Medico;
use App\Models\Relatorio;
use App\Services\Notifications\MedicoNotifier;

class RelatorioObserver
{
    public function __construct(private MedicoNotifier $notifier) {}

    public function created(Relatorio $r): void
    {
        if ($r->medico_id) {
            $this->dispatch($r, $r->medico_id);
        }
    }

    public function updated(Relatorio $r): void
    {
        if ($r->wasChanged('medico_id') && $r->medico_id
            && $r->getOriginal('medico_id') !== $r->medico_id) {
            $this->dispatch($r, $r->medico_id);
        }
    }

    private function dispatch(Relatorio $r, int $medicoId): void
    {
        $medico = Medico::find($medicoId);
        if (! $medico) return;

        $r->loadMissing('paciente');
        $this->notifier->notifyAssignment($medico, 'relatorio', [
            'numero' => $r->numero,
            'paciente' => $r->paciente?->nome ?? '—',
            'tipo_doc' => Relatorio::TIPOS[$r->tipo] ?? $r->tipo,
        ]);
    }
}
