<?php

namespace App\Observers;

use App\Models\Atestado;
use App\Models\Medico;
use App\Services\Notifications\MedicoNotifier;

class AtestadoObserver
{
    public function __construct(private MedicoNotifier $notifier) {}

    public function created(Atestado $a): void
    {
        if ($a->medico_id) {
            $this->dispatch($a, $a->medico_id);
        }
    }

    public function updated(Atestado $a): void
    {
        // Notifica apenas quando o médico for ATRIBUÍDO (mudou de null para valor,
        // ou foi reatribuído a outro médico)
        if ($a->wasChanged('medico_id') && $a->medico_id
            && $a->getOriginal('medico_id') !== $a->medico_id) {
            $this->dispatch($a, $a->medico_id);
        }
    }

    private function dispatch(Atestado $a, int $medicoId): void
    {
        $medico = Medico::find($medicoId);
        if (! $medico) return;

        $a->loadMissing('paciente');
        $this->notifier->notifyAssignment($medico, 'atestado', [
            'numero' => $a->numero,
            'paciente' => $a->paciente?->nome ?? '—',
            'tipo_doc' => $a->tipo,
        ]);
    }
}
