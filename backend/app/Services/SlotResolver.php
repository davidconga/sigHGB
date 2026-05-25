<?php

namespace App\Services;

use App\Models\Agendamento;
use App\Models\AusenciaMedico;
use App\Models\DisponibilidadeMedico;
use App\Models\Medico;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class SlotResolver
{
    /**
     * Devolve todos os slots possíveis para um médico num dia, com flag
     * "ocupado" para cada slot.
     *
     * @return array<int, array{inicio: string, fim: string, ocupado: bool, agendamento_numero: ?string}>
     */
    public function slotsDoDia(Medico $medico, Carbon $data): array
    {
        $diaSemana = $data->dayOfWeek; // Carbon: 0=Domingo

        $disponibilidades = DisponibilidadeMedico::where('medico_id', $medico->id)
            ->where('dia_semana', $diaSemana)
            ->where('ativo', true)
            ->orderBy('hora_inicio')
            ->get();

        if ($disponibilidades->isEmpty()) {
            return [];
        }

        $ausencias = AusenciaMedico::where('medico_id', $medico->id)
            ->whereDate('inicio', '<=', $data->toDateString())
            ->whereDate('fim', '>=', $data->toDateString())
            ->get();

        $ocupados = Agendamento::where('medico_id', $medico->id)
            ->whereDate('data_agendamento', $data->toDateString())
            ->whereNotIn('status', ['cancelada', 'faltou'])
            ->get(['id', 'numero', 'data_agendamento', 'duracao_minutos'])
            ->map(fn ($a) => [
                'inicio' => $a->data_agendamento,
                'fim'    => $a->data_agendamento->copy()->addMinutes($a->duracao_minutos),
                'numero' => $a->numero,
            ]);

        $slots = [];
        foreach ($disponibilidades as $d) {
            $cursor = $data->copy()->setTimeFromTimeString($d->hora_inicio);
            $fimBloco = $data->copy()->setTimeFromTimeString($d->hora_fim);
            $duracao = $d->duracao_minutos ?: 30;

            while ($cursor->copy()->addMinutes($duracao)->lte($fimBloco)) {
                $slotFim = $cursor->copy()->addMinutes($duracao);

                $emAusencia = $ausencias->contains(
                    fn ($au) => $cursor->lt($au->fim) && $slotFim->gt($au->inicio)
                );

                if (! $emAusencia) {
                    $conflito = $ocupados->first(
                        fn ($o) => $cursor->lt($o['fim']) && $slotFim->gt($o['inicio'])
                    );

                    $slots[] = [
                        'inicio'             => $cursor->format('H:i'),
                        'fim'                => $slotFim->format('H:i'),
                        'duracao_minutos'    => $duracao,
                        'ocupado'            => (bool) $conflito,
                        'agendamento_numero' => $conflito['numero'] ?? null,
                    ];
                }

                $cursor->addMinutes($duracao);
            }
        }

        return $slots;
    }

    /**
     * Verifica se um intervalo concreto cai dentro de disponibilidade do médico
     * (com horário semanal definido e sem ausência a sobrepor).
     *
     * Devolve null se OK, ou mensagem de erro descritiva.
     */
    public function validar(Medico $medico, Carbon $inicio, int $duracaoMinutos): ?string
    {
        $fim = $inicio->copy()->addMinutes($duracaoMinutos);

        $temDisponibilidade = DisponibilidadeMedico::where('medico_id', $medico->id)
            ->where('dia_semana', $inicio->dayOfWeek)
            ->where('ativo', true)
            ->get()
            ->contains(function (DisponibilidadeMedico $d) use ($inicio, $fim) {
                $bloco_inicio = $inicio->copy()->setTimeFromTimeString($d->hora_inicio);
                $bloco_fim    = $inicio->copy()->setTimeFromTimeString($d->hora_fim);
                return $inicio->gte($bloco_inicio) && $fim->lte($bloco_fim);
            });

        if (! $temDisponibilidade) {
            return 'O médico não tem disponibilidade neste horário.';
        }

        $emAusencia = AusenciaMedico::where('medico_id', $medico->id)
            ->where('inicio', '<', $fim)
            ->where('fim', '>', $inicio)
            ->exists();

        if ($emAusencia) {
            return 'O médico está ausente neste período.';
        }

        return null;
    }

    /**
     * Devolve uma matriz semanal do horário base do médico, organizada
     * por dia da semana — para apresentar na UI.
     */
    public function horarioSemanal(Medico $medico): Collection
    {
        return DisponibilidadeMedico::where('medico_id', $medico->id)
            ->orderBy('dia_semana')
            ->orderBy('hora_inicio')
            ->get()
            ->groupBy('dia_semana');
    }
}
