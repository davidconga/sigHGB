<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Agendamento;
use App\Models\Medico;
use App\Models\Paciente;
use App\Models\PortalMarcacaoSession;
use App\Services\SlotResolver;
use App\Services\Sms\SmsService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Portal publico para pacientes marcarem consultas em casa, sem login.
 * Verifica identidade por codigo SMS antes de criar a marcacao.
 *
 * As marcacoes criadas entram como `pendente` e precisam de aprovacao
 * da recepcao para confirmar.
 */
class PortalMarcacaoController extends Controller
{
    public function __construct(
        private SmsService $sms,
        private SlotResolver $slotResolver,
    ) {}

    /**
     * Lista publica de medicos ativos (apenas campos seguros).
     * Opcionalmente filtra por especialidade.
     */
    public function medicos(Request $request): JsonResponse
    {
        $q = Medico::where('ativo', true)->orderBy('nome');
        if ($esp = $request->string('especialidade')->trim()->value()) {
            $q->where('especialidade', $esp);
        }
        return response()->json([
            'data' => $q->get(['id', 'nome', 'especialidade']),
        ]);
    }

    /**
     * Especialidades distintas com contagem de medicos disponiveis.
     */
    public function especialidades(): JsonResponse
    {
        return response()->json([
            'data' => Medico::where('ativo', true)
                ->whereNotNull('especialidade')
                ->where('especialidade', '!=', '')
                ->selectRaw('especialidade, count(*) as medicos_count')
                ->groupBy('especialidade')
                ->orderBy('especialidade')
                ->get(),
        ]);
    }

    /**
     * Slots disponiveis publicos — reutiliza SlotResolver mas so devolve
     * os livres (esconde o numero do agendamento ocupante por privacidade).
     */
    public function slots(Request $request, Medico $medico): JsonResponse
    {
        $data = $request->validate(['data' => ['required', 'date', 'after_or_equal:today']]);

        $slots = collect($this->slotResolver->slotsDoDia($medico, Carbon::parse($data['data'])))
            ->map(fn ($s) => [
                'inicio'          => $s['inicio'],
                'fim'             => $s['fim'],
                'duracao_minutos' => $s['duracao_minutos'],
                'disponivel'      => ! $s['ocupado'],
            ])
            ->values();

        return response()->json(['data' => $slots]);
    }

    /**
     * Verifica se ja existe paciente com este BI. Se sim, devolve apenas
     * o primeiro nome + telefone parcial para confirmar identidade visualmente,
     * nunca dados sensiveis completos.
     */
    public function verificarPaciente(Request $request): JsonResponse
    {
        $data = $request->validate([
            'bi' => ['required', 'string', 'max:20'],
        ]);

        $p = Paciente::where('bi', $data['bi'])->first(['id', 'nome', 'telefone']);
        if (! $p) {
            return response()->json(['existe' => false]);
        }

        return response()->json([
            'existe'       => true,
            'paciente_id'  => $p->id,
            'primeiro_nome' => explode(' ', trim($p->nome))[0] ?? '',
            'telefone_mask' => $p->telefone
                ? substr($p->telefone, 0, 3).'****'.substr($p->telefone, -2)
                : null,
        ]);
    }

    /**
     * Passo 1: receber dados completos (paciente novo ou existente +
     * dados da marcacao). Cria sessao + envia codigo SMS.
     */
    public function iniciar(Request $request): JsonResponse
    {
        $data = $request->validate([
            // Paciente existente OU novo (mutuamente exclusivos)
            'paciente_id'      => ['nullable', 'required_without:paciente_novo', 'exists:pacientes,id'],
            'paciente_novo'    => ['nullable', 'required_without:paciente_id', 'array'],
            'paciente_novo.nome'            => ['required_with:paciente_novo', 'string', 'max:255'],
            'paciente_novo.bi'              => ['required_with:paciente_novo', 'string', 'max:20'],
            'paciente_novo.data_nascimento' => ['required_with:paciente_novo', 'date', 'before:today'],
            'paciente_novo.sexo'            => ['nullable', 'in:M,F'],
            // Marcacao
            'medico_id'        => ['required', 'exists:medicos,id'],
            'data_agendamento' => ['required', 'date', 'after:now'],
            'duracao_minutos'  => ['nullable', 'integer', 'min:5', 'max:480'],
            'motivo'           => ['nullable', 'string', 'max:500'],
            // Telefone para SMS
            'telefone'         => ['required', 'string', 'max:30'],
        ]);

        // Validar slot do medico escolhido
        $medico = Medico::find($data['medico_id']);
        $erro = $this->slotResolver->validar(
            $medico,
            Carbon::parse($data['data_agendamento']),
            (int) ($data['duracao_minutos'] ?? 30),
        );
        if ($erro) {
            return response()->json([
                'message' => $erro,
                'errors'  => ['data_agendamento' => [$erro]],
            ], 422);
        }

        // Gerar codigo 6 digitos
        $codigo = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $session = PortalMarcacaoSession::create([
            'telefone'       => $data['telefone'],
            'codigo_hash'    => Hash::make($codigo),
            'expira_em'      => now()->addMinutes(10),
            'paciente_id'    => $data['paciente_id'] ?? null,
            'paciente_novo'  => $data['paciente_novo'] ?? null,
            'marcacao_dados' => [
                'medico_id'        => $data['medico_id'],
                'data_agendamento' => $data['data_agendamento'],
                'duracao_minutos'  => (int) ($data['duracao_minutos'] ?? 30),
                'motivo'           => $data['motivo'] ?? null,
            ],
            'ip'         => $request->ip(),
            'user_agent' => Str::limit((string) $request->userAgent(), 250, ''),
        ]);

        // Enviar SMS com codigo
        $this->sms->dispatch(
            to: $data['telefone'],
            body: "HGB: O seu codigo de verificacao e {$codigo}. Valido por 10 minutos. Nao partilhe este codigo.",
            pacienteId: $data['paciente_id'] ?? null,
        );

        return response()->json([
            'session_id'      => $session->id,
            'expira_em'       => $session->expira_em->toIso8601String(),
            'telefone_mask'   => substr($data['telefone'], 0, 3).'****'.substr($data['telefone'], -2),
        ], 201);
    }

    /**
     * Consulta publica do estado de uma marcacao. Requer numero do
     * agendamento + telefone (qualquer um dos dois canais — match exato
     * ou pelos ultimos 4 digitos para tolerancia a prefixo internacional).
     */
    public function consultar(Request $request): JsonResponse
    {
        $data = $request->validate([
            'numero'   => ['required', 'string', 'max:30'],
            'telefone' => ['required', 'string', 'max:30'],
        ]);

        $ag = Agendamento::with(['paciente:id,nome,telefone', 'medico:id,nome,especialidade'])
            ->where('numero', strtoupper(trim($data['numero'])))
            ->first();

        if (! $ag) {
            return response()->json(['message' => 'Marcação não encontrada.'], 404);
        }

        // Confirma identidade pelo telefone do paciente (match exato ou ultimos 4 digitos)
        $tel = preg_replace('/\D/', '', $ag->paciente?->telefone ?? '');
        $tentativa = preg_replace('/\D/', '', $data['telefone']);
        $match = $tel && $tentativa
            && ($tel === $tentativa || str_ends_with($tel, substr($tentativa, -4)));

        if (! $match) {
            return response()->json(['message' => 'Número e telefone não coincidem.'], 403);
        }

        $statusLabels = [
            'pendente'       => 'Pendente de aprovação pela recepção',
            'confirmada'     => 'Confirmada',
            'presente'       => 'Paciente presente (check-in feito)',
            'em_atendimento' => 'Em atendimento',
            'realizada'      => 'Consulta realizada',
            'cancelada'      => 'Cancelada',
            'faltou'         => 'Marcada como faltou',
        ];

        return response()->json([
            'numero'              => $ag->numero,
            'status'              => $ag->status,
            'status_label'        => $statusLabels[$ag->status] ?? $ag->status,
            'data_agendamento'    => $ag->data_agendamento->toIso8601String(),
            'duracao_minutos'     => $ag->duracao_minutos,
            'medico'              => $ag->medico ? ['nome' => $ag->medico->nome, 'especialidade' => $ag->medico->especialidade] : null,
            'motivo'              => $ag->motivo,
            'motivo_cancelamento' => $ag->motivo_cancelamento,
            'check_in_em'         => $ag->check_in_em?->toIso8601String(),
            'criado_em'           => $ag->created_at->toIso8601String(),
            'paciente_primeiro_nome' => explode(' ', trim($ag->paciente?->nome ?? ''))[0] ?? '',
        ]);
    }

    /**
     * Passo 2: paciente introduz o codigo recebido por SMS. Se valido,
     * cria a marcacao em estado `pendente` (aguarda recepcao).
     */
    public function confirmar(Request $request): JsonResponse
    {
        $data = $request->validate([
            'session_id' => ['required', 'uuid'],
            'codigo'     => ['required', 'string', 'size:6'],
        ]);

        $s = PortalMarcacaoSession::find($data['session_id']);
        if (! $s) {
            return response()->json(['message' => 'Sessão não encontrada ou expirada.'], 404);
        }

        if ($s->verificado_em) {
            return response()->json([
                'message'         => 'Marcação já confirmada.',
                'agendamento_id'  => $s->agendamento_id,
            ]);
        }

        if ($s->isExpirada()) {
            return response()->json(['message' => 'Código expirado. Inicie nova marcação.'], 410);
        }

        if ($s->tentativas >= 5) {
            return response()->json(['message' => 'Demasiadas tentativas. Inicie nova marcação.'], 429);
        }

        if (! Hash::check($data['codigo'], $s->codigo_hash)) {
            $s->increment('tentativas');
            return response()->json([
                'message'    => 'Código incorreto.',
                'tentativas' => $s->tentativas,
                'restantes'  => max(0, 5 - $s->tentativas),
            ], 422);
        }

        // Criar paciente (se for novo) — atualizar telefone caso vazio
        $pacienteId = $s->paciente_id;
        if (! $pacienteId && $s->paciente_novo) {
            $novo = $s->paciente_novo;
            // Reverificar se entretanto algum paciente foi criado com o mesmo BI
            $existente = Paciente::where('bi', $novo['bi'])->first();
            if ($existente) {
                $pacienteId = $existente->id;
                if (! $existente->telefone) {
                    $existente->update(['telefone' => $s->telefone]);
                }
            } else {
                $paciente = Paciente::create([
                    'nome'            => $novo['nome'],
                    'bi'              => $novo['bi'],
                    'data_nascimento' => $novo['data_nascimento'],
                    'sexo'            => $novo['sexo'] ?? null,
                    'telefone'        => $s->telefone,
                ]);
                $pacienteId = $paciente->id;
            }
        } elseif ($pacienteId) {
            // Atualizar telefone do paciente existente se nao tiver
            $p = Paciente::find($pacienteId);
            if ($p && ! $p->telefone) {
                $p->update(['telefone' => $s->telefone]);
            }
        }

        // Criar agendamento pendente
        $m = $s->marcacao_dados;
        $agendamento = Agendamento::create([
            'paciente_id'      => $pacienteId,
            'medico_id'        => $m['medico_id'] ?? null,
            'data_agendamento' => $m['data_agendamento'],
            'duracao_minutos'  => $m['duracao_minutos'] ?? 30,
            'motivo'           => $m['motivo'] ?? null,
            'status'           => 'pendente',
            'origem'           => 'paciente_app',
        ]);

        $s->update([
            'verificado_em'  => now(),
            'agendamento_id' => $agendamento->id,
            'paciente_id'    => $pacienteId,
        ]);

        // SMS de confirmacao do pedido (com link para consultar estado)
        $quando = $agendamento->data_agendamento->format('d/m/Y \à\s H:i');
        $this->sms->dispatch(
            to: $s->telefone,
            body: "HGB: Pedido {$agendamento->numero} recebido para {$quando}. Veja o estado em sig.hgbenguela.com/consultar",
            pacienteId: $pacienteId,
        );

        return response()->json([
            'agendamento_numero' => $agendamento->numero,
            'agendamento_id'     => $agendamento->id,
            'status'             => 'pendente',
            'mensagem'           => 'Pedido enviado. Aguarde confirmação da recepção.',
        ], 201);
    }
}
