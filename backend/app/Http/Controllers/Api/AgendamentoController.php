<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Agendamento;
use App\Models\Paciente;
use App\Models\User;
use App\Models\Medico;
use App\Services\Notifications\PushChannel;
use App\Services\SlotResolver;
use App\Services\Sms\SmsService;
use App\Support\MedicoScope;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class AgendamentoController extends Controller
{
    public function __construct(
        private SmsService $sms,
        private PushChannel $push,
        private SlotResolver $slotResolver,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = MedicoScope::apply(
            Agendamento::with([
                'paciente:id,nome,numero_processo,telefone',
                'medico:id,nome,especialidade',
                'servico:id,nome,departamento_id',
                'criadoPor:id,name',
            ])
        );

        if ($pid = $request->integer('paciente_id')) {
            $query->where('paciente_id', $pid);
        }
        if ($mid = $request->integer('medico_id')) {
            $query->where('medico_id', $mid);
        }
        if ($sid = $request->integer('servico_id')) {
            $query->where('servico_id', $sid);
        }
        if ($status = $request->string('status')->value()) {
            $query->where('status', $status);
        }
        if ($de = $request->date('data_de')) {
            $query->whereDate('data_agendamento', '>=', $de);
        }
        if ($ate = $request->date('data_ate')) {
            $query->whereDate('data_agendamento', '<=', $ate);
        }

        $order = $request->string('order')->value() ?: 'desc';

        return response()->json(
            $query->orderBy('data_agendamento', $order === 'asc' ? 'asc' : 'desc')
                ->paginate($request->integer('per_page', 20))
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'paciente_id'        => ['required', 'exists:pacientes,id'],
            'medico_id'          => ['nullable', 'exists:medicos,id'],
            'servico_id'         => ['nullable', 'exists:servicos,id'],
            'data_agendamento'   => ['required', 'date', 'after_or_equal:today'],
            'duracao_minutos'    => ['nullable', 'integer', 'min:5', 'max:480'],
            'motivo'             => ['nullable', 'string', 'max:500'],
            'observacoes'        => ['nullable', 'string'],
            'origem'             => ['nullable', 'in:recepcao,medico,paciente_app,admin'],
            'status'             => ['nullable', 'in:pendente,confirmada'],
            'notificar_sms'      => ['nullable', 'boolean'],
        ]);

        if ($conflict = $this->detectarConflito(
            (int) $data['paciente_id'],
            $data['medico_id'] ?? null,
            Carbon::parse($data['data_agendamento']),
            (int) ($data['duracao_minutos'] ?? 30),
        )) {
            return response()->json([
                'message' => 'Conflito de agendamento.',
                'errors'  => ['data_agendamento' => [$conflict]],
            ], 422);
        }

        if ($erro = $this->validarSlot($data['medico_id'] ?? null, $data['data_agendamento'], (int) ($data['duracao_minutos'] ?? 30))) {
            return response()->json([
                'message' => 'Horário sem disponibilidade.',
                'errors'  => ['data_agendamento' => [$erro]],
            ], 422);
        }

        $notificar = (bool) ($data['notificar_sms'] ?? true);
        unset($data['notificar_sms']);

        $data['criado_por'] = auth()->id();
        $data['origem']     = $data['origem'] ?? $this->inferirOrigem();

        $ag = Agendamento::create($data);

        if ($notificar) {
            $this->enviarSmsConfirmacao($ag);
        }

        return response()->json($ag->load(['paciente', 'medico', 'servico']), 201);
    }

    public function show(Agendamento $agendamento): JsonResponse
    {
        $this->guard($agendamento);
        return response()->json($agendamento->load(['paciente', 'medico', 'servico', 'consulta', 'criadoPor']));
    }

    public function update(Request $request, Agendamento $agendamento): JsonResponse
    {
        $this->guard($agendamento);

        $data = $request->validate([
            'medico_id'            => ['nullable', 'exists:medicos,id'],
            'servico_id'           => ['nullable', 'exists:servicos,id'],
            'data_agendamento'     => ['sometimes', 'date'],
            'duracao_minutos'      => ['nullable', 'integer', 'min:5', 'max:480'],
            'motivo'               => ['nullable', 'string', 'max:500'],
            'observacoes'          => ['nullable', 'string'],
            'status'               => ['nullable', 'in:pendente,confirmada,presente,em_atendimento,realizada,cancelada,faltou'],
            'motivo_cancelamento'  => ['nullable', 'string', 'max:255'],
        ]);

        $remarcado = isset($data['data_agendamento'])
            && Carbon::parse($data['data_agendamento'])->ne($agendamento->data_agendamento);

        if ($remarcado || isset($data['medico_id']) || isset($data['duracao_minutos'])) {
            $novoMedicoId = $data['medico_id'] ?? $agendamento->medico_id;
            $novaData     = $data['data_agendamento'] ?? $agendamento->data_agendamento;
            $novaDuracao  = (int) ($data['duracao_minutos'] ?? $agendamento->duracao_minutos);

            if ($erro = $this->validarSlot($novoMedicoId, $novaData, $novaDuracao)) {
                return response()->json([
                    'message' => 'Horário sem disponibilidade.',
                    'errors'  => ['data_agendamento' => [$erro]],
                ], 422);
            }
        }

        if (isset($data['status']) && $data['status'] === 'cancelada' && ! $agendamento->cancelado_em) {
            $data['cancelado_em'] = now();
        }

        $agendamento->update($data);

        if ($remarcado && in_array($agendamento->status, ['pendente', 'confirmada'], true)) {
            $this->enviarSmsRemarcacao($agendamento->fresh());
        }

        return response()->json($agendamento->load(['paciente', 'medico', 'servico']));
    }

    public function destroy(Agendamento $agendamento): JsonResponse
    {
        $this->guard($agendamento);
        $agendamento->delete();

        return response()->json(['message' => 'Agendamento removido.']);
    }

    public function checkIn(Agendamento $agendamento): JsonResponse
    {
        $this->guard($agendamento);

        if (! in_array($agendamento->status, ['pendente', 'confirmada'], true)) {
            return response()->json([
                'message' => 'Apenas marcações pendentes ou confirmadas podem fazer check-in.',
            ], 422);
        }

        $agendamento->update([
            'status'      => 'presente',
            'check_in_em' => now(),
        ]);

        $this->notificarMedicoCheckIn($agendamento->fresh()->load(['paciente', 'medico', 'servico']));

        return response()->json($agendamento->load(['paciente', 'medico', 'servico']));
    }

    private function notificarMedicoCheckIn(Agendamento $ag): void
    {
        if (! $ag->medico_id) return;

        $hora = $ag->data_agendamento->format('H:i');
        $servico = $ag->servico?->nome ? " ({$ag->servico->nome})" : '';
        $body = "Paciente {$ag->paciente?->nome} fez check-in para a marcacao das {$hora}{$servico}.";

        User::where('medico_id', $ag->medico_id)->each(function (User $u) use ($ag, $body) {
            $this->push->sendToUser(
                userId: $u->id,
                title: 'Paciente em fila',
                body: $body,
                data: [
                    'tipo' => 'agendamento_checkin',
                    'agendamento_id' => $ag->id,
                    'numero' => $ag->numero,
                ],
            );
        });
    }

    public function cancelar(Request $request, Agendamento $agendamento): JsonResponse
    {
        $this->guard($agendamento);

        $data = $request->validate([
            'motivo_cancelamento' => ['nullable', 'string', 'max:255'],
        ]);

        $agendamento->update([
            'status'              => 'cancelada',
            'cancelado_em'        => now(),
            'motivo_cancelamento' => $data['motivo_cancelamento'] ?? null,
        ]);

        $this->enviarSmsCancelamento($agendamento->fresh());

        return response()->json($agendamento->load(['paciente', 'medico', 'servico']));
    }

    public function agenda(Request $request): JsonResponse
    {
        $data = $request->validate([
            'medico_id' => ['nullable', 'exists:medicos,id'],
            'data_de'   => ['required', 'date'],
            'data_ate'  => ['required', 'date', 'after_or_equal:data_de'],
        ]);

        $query = MedicoScope::apply(
            Agendamento::with(['paciente:id,nome,telefone', 'medico:id,nome', 'servico:id,nome'])
                ->whereDate('data_agendamento', '>=', $data['data_de'])
                ->whereDate('data_agendamento', '<=', $data['data_ate'])
                ->whereNotIn('status', ['cancelada', 'faltou'])
        );

        if (! empty($data['medico_id'])) {
            $query->where('medico_id', $data['medico_id']);
        }

        return response()->json([
            'data' => $query->orderBy('data_agendamento')->get(),
        ]);
    }

    /**
     * Marcações ativas de um paciente — usado no formulário de consulta
     * para pré-preencher dados quando o médico inicia o atendimento.
     */
    public function porPaciente(Request $request, int $paciente): JsonResponse
    {
        $items = MedicoScope::apply(
            Agendamento::with(['medico:id,nome', 'servico:id,nome'])
                ->where('paciente_id', $paciente)
                ->ativos()
                ->orderBy('data_agendamento')
        )->limit(10)->get();

        return response()->json(['data' => $items]);
    }

    public function fila(Request $request): JsonResponse
    {
        $query = MedicoScope::apply(
            Agendamento::with(['paciente:id,nome,numero_processo', 'medico:id,nome', 'servico:id,nome'])
                ->naFila()
                ->doDia($request->date('data')?->toDateString())
        );

        if ($sid = $request->integer('servico_id')) {
            $query->where('servico_id', $sid);
        }
        if ($mid = $request->integer('medico_id')) {
            $query->where('medico_id', $mid);
        }

        return response()->json([
            'data' => $query->orderBy('check_in_em')->orderBy('data_agendamento')->get(),
        ]);
    }

    /**
     * Estatísticas mensais agrupadas por médico + por serviço,
     * com totais por estado e taxa de absenteísmo.
     */
    public function estatisticas(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ano'        => ['nullable', 'integer', 'min:2020', 'max:2099'],
            'mes'        => ['nullable', 'integer', 'min:1', 'max:12'],
            'data_de'    => ['nullable', 'date'],
            'data_ate'   => ['nullable', 'date', 'after_or_equal:data_de'],
        ]);

        [$de, $ate] = $this->resolverIntervalo($data);

        $base = MedicoScope::apply(Agendamento::query())
            ->whereBetween('data_agendamento', [$de, $ate]);

        $totaisPorEstado = (clone $base)
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status')
            ->all();

        $porMedico = (clone $base)
            ->with('medico:id,nome,especialidade')
            ->selectRaw('medico_id, status, count(*) as total')
            ->groupBy('medico_id', 'status')
            ->get()
            ->groupBy('medico_id')
            ->map(function ($linhas, $medicoId) {
                $primeira = $linhas->first();
                $totais = $linhas->pluck('total', 'status')->all();
                return [
                    'medico_id'    => $medicoId,
                    'medico'       => $primeira->medico?->nome ?? '— sem médico —',
                    'especialidade'=> $primeira->medico?->especialidade,
                    'total'        => array_sum($totais),
                    'por_estado'   => $totais,
                ];
            })
            ->sortByDesc('total')
            ->values();

        $porServico = (clone $base)
            ->with('servico:id,nome')
            ->selectRaw('servico_id, status, count(*) as total')
            ->groupBy('servico_id', 'status')
            ->get()
            ->groupBy('servico_id')
            ->map(function ($linhas, $servicoId) {
                $primeira = $linhas->first();
                $totais = $linhas->pluck('total', 'status')->all();
                return [
                    'servico_id' => $servicoId,
                    'servico'    => $primeira->servico?->nome ?? '— sem serviço —',
                    'total'      => array_sum($totais),
                    'por_estado' => $totais,
                ];
            })
            ->sortByDesc('total')
            ->values();

        $porDia = (clone $base)
            ->selectRaw("strftime('%Y-%m-%d', data_agendamento) as dia, count(*) as total")
            ->groupBy('dia')
            ->orderBy('dia')
            ->get()
            ->map(fn ($r) => ['dia' => $r->dia, 'total' => (int) $r->total]);

        $total = array_sum($totaisPorEstado);
        $realizadas = $totaisPorEstado['realizada'] ?? 0;
        $faltou     = $totaisPorEstado['faltou'] ?? 0;
        $canceladas = $totaisPorEstado['cancelada'] ?? 0;
        $atendidas  = $realizadas + ($totaisPorEstado['em_atendimento'] ?? 0);
        $taxaAbsenteismo = $total > 0 ? round(($faltou / $total) * 100, 1) : 0;
        $taxaConclusao   = $total > 0 ? round(($realizadas / $total) * 100, 1) : 0;

        return response()->json([
            'intervalo' => [
                'de'  => $de->toIso8601String(),
                'ate' => $ate->toIso8601String(),
            ],
            'totais' => [
                'total'             => $total,
                'por_estado'        => $totaisPorEstado,
                'realizadas'        => $realizadas,
                'faltou'            => $faltou,
                'canceladas'        => $canceladas,
                'atendidas'         => $atendidas,
                'taxa_absenteismo'  => $taxaAbsenteismo,
                'taxa_conclusao'    => $taxaConclusao,
            ],
            'por_medico'  => $porMedico,
            'por_servico' => $porServico,
            'por_dia'     => $porDia,
        ]);
    }

    public function mapaMensalPdf(Request $request): Response
    {
        $data = $request->validate([
            'ano'      => ['nullable', 'integer', 'min:2020', 'max:2099'],
            'mes'      => ['nullable', 'integer', 'min:1', 'max:12'],
            'data_de'  => ['nullable', 'date'],
            'data_ate' => ['nullable', 'date', 'after_or_equal:data_de'],
        ]);

        [$de, $ate] = $this->resolverIntervalo($data);
        $stats = $this->estatisticas($request)->getData(true);

        $pdf = Pdf::loadView('pdf.agendamentos_mapa', [
            'stats' => $stats,
            'de'    => $de,
            'ate'   => $ate,
        ]);

        return $pdf->stream('mapa-marcacoes-'.$de->format('Y-m').'.pdf');
    }

    private function resolverIntervalo(array $data): array
    {
        if (! empty($data['data_de']) && ! empty($data['data_ate'])) {
            return [
                Carbon::parse($data['data_de'])->startOfDay(),
                Carbon::parse($data['data_ate'])->endOfDay(),
            ];
        }
        $ano = $data['ano'] ?? now()->year;
        $mes = $data['mes'] ?? now()->month;
        $de  = Carbon::create($ano, $mes, 1)->startOfMonth();
        $ate = $de->copy()->endOfMonth();
        return [$de, $ate];
    }

    public function pdf(Agendamento $agendamento): Response
    {
        $this->guard($agendamento);
        $agendamento->load(['paciente', 'medico', 'servico', 'criadoPor']);
        $pdf = Pdf::loadView('pdf.agendamento', ['agendamento' => $agendamento]);

        return $pdf->stream("marcacao-{$agendamento->numero}.pdf");
    }

    private function guard(Agendamento $a): void
    {
        if (! MedicoScope::canAccess($a)) {
            throw new AccessDeniedHttpException('Sem acesso a este agendamento.');
        }
    }

    private function inferirOrigem(): string
    {
        $user = auth()->user();
        if (! $user) return 'recepcao';
        if ($user->hasRole('admin')) return 'admin';
        if ($user->hasRole('medico')) return 'medico';
        return 'recepcao';
    }

    /**
     * Valida que o médico tem disponibilidade no horário. Se não houver médico
     * atribuído, salta a validação (marcação sem médico = encaixe).
     */
    private function validarSlot(?int $medicoId, $dataHora, int $duracao): ?string
    {
        if (! $medicoId) return null;
        $medico = Medico::find($medicoId);
        if (! $medico) return null;
        return $this->slotResolver->validar($medico, Carbon::parse($dataHora), $duracao);
    }

    private function detectarConflito(int $pacienteId, ?int $medicoId, Carbon $inicio, int $duracao): ?string
    {
        $fim = $inicio->copy()->addMinutes($duracao);

        $q = Agendamento::query()
            ->whereNotIn('status', ['cancelada', 'realizada', 'faltou'])
            ->where(function ($qq) use ($pacienteId, $medicoId) {
                $qq->where('paciente_id', $pacienteId);
                if ($medicoId) $qq->orWhere('medico_id', $medicoId);
            });

        $candidatos = $q->get(['id', 'paciente_id', 'medico_id', 'data_agendamento', 'duracao_minutos']);

        foreach ($candidatos as $c) {
            $cInicio = $c->data_agendamento;
            $cFim    = $c->data_agendamento->copy()->addMinutes($c->duracao_minutos);
            if ($inicio->lt($cFim) && $fim->gt($cInicio)) {
                if ($c->paciente_id === $pacienteId) {
                    return 'O paciente já tem outra marcação a sobrepor este horário.';
                }
                if ($medicoId && $c->medico_id === $medicoId) {
                    return 'O médico já tem outra marcação a sobrepor este horário.';
                }
            }
        }

        return null;
    }

    private function enviarSmsConfirmacao(Agendamento $ag): void
    {
        $paciente = $ag->paciente()->first();
        if (! $paciente?->telefone) return;

        $quando = $ag->data_agendamento->format('d/m/Y \à\s H:i');
        $medico = $ag->medico_id ? optional($ag->medico()->first())->nome : null;
        $servico = $ag->servico_id ? optional($ag->servico()->first())->nome : null;
        $alvo = $medico ? "Dr(a). {$medico}" : ($servico ?? 'consulta');

        $body = "HGB: Marcacao {$ag->numero} confirmada para {$quando} com {$alvo}. Compareca 15min antes.";

        $this->sms->dispatch(
            to: $paciente->telefone,
            body: $body,
            pacienteId: $paciente->id,
            userId: auth()->id(),
        );
    }

    private function enviarSmsRemarcacao(Agendamento $ag): void
    {
        $paciente = $ag->paciente()->first();
        if (! $paciente?->telefone) return;

        $quando = $ag->data_agendamento->format('d/m/Y \à\s H:i');
        $body = "HGB: A sua marcacao {$ag->numero} foi remarcada para {$quando}.";

        $this->sms->dispatch(
            to: $paciente->telefone,
            body: $body,
            pacienteId: $paciente->id,
            userId: auth()->id(),
        );
    }

    private function enviarSmsCancelamento(Agendamento $ag): void
    {
        $paciente = $ag->paciente()->first();
        if (! $paciente?->telefone) return;

        $body = "HGB: A sua marcacao {$ag->numero} foi cancelada. Contacte o hospital para remarcar.";

        $this->sms->dispatch(
            to: $paciente->telefone,
            body: $body,
            pacienteId: $paciente->id,
            userId: auth()->id(),
        );
    }
}
