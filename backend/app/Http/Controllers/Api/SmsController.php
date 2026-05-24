<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Paciente;
use App\Models\SmsMessage;
use App\Services\Sms\SmsService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SmsController extends Controller
{
    public function __construct(private SmsService $sms) {}

    public function index(Request $request): JsonResponse
    {
        $query = SmsMessage::with(['paciente:id,nome', 'funcionario:id,nome', 'user:id,name']);

        if ($s = $request->string('search')->trim()->value()) {
            $query->where(function ($q) use ($s) {
                $q->where('to', 'like', "%{$s}%")
                    ->orWhere('body', 'like', "%{$s}%")
                    ->orWhereHas('paciente', fn ($p) => $p->where('nome', 'like', "%{$s}%"));
            });
        }
        if ($status = $request->string('status')->value()) $query->where('status', $status);
        if ($batch = $request->string('batch_id')->value()) $query->where('batch_id', $batch);
        if ($de = $request->date('data_de')) $query->whereDate('created_at', '>=', $de);
        if ($ate = $request->date('data_ate')) $query->whereDate('created_at', '<=', $ate);

        return response()->json(
            $query->latest()->paginate($request->integer('per_page', 20))
        );
    }

    public function stats(): JsonResponse
    {
        $driverInstance = app(\App\Services\Sms\SmsDriver::class);
        $balance = method_exists($driverInstance, 'balance') ? $driverInstance->balance() : null;

        return response()->json([
            'driver' => $this->sms->driverName(),
            'pendentes' => SmsMessage::where('status', 'pendente')->count(),
            'enviados' => SmsMessage::where('status', 'enviado')->count(),
            'falhados' => SmsMessage::where('status', 'falhado')->count(),
            'cancelados' => SmsMessage::where('status', 'cancelado')->count(),
            'agendados_futuros' => SmsMessage::where('status', 'pendente')
                ->whereNotNull('scheduled_at')->where('scheduled_at', '>', now())->count(),
            'balance' => $balance,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'to' => ['nullable', 'string', 'max:30'],
            'paciente_id' => ['nullable', 'exists:pacientes,id'],
            'body' => ['required', 'string', 'max:480'],
            'scheduled_at' => ['nullable', 'date'],
        ]);

        $to = $data['to'] ?? null;
        $pacienteId = $data['paciente_id'] ?? null;

        if (! $to && $pacienteId) {
            $to = Paciente::find($pacienteId)?->telefone;
        }
        if (! $to) {
            return response()->json(['message' => 'Destinatário em falta (to ou paciente_id com telefone).'], 422);
        }

        $msg = $this->sms->dispatch(
            to: $to,
            body: $data['body'],
            pacienteId: $pacienteId,
            userId: $request->user()->id,
            scheduledAt: ! empty($data['scheduled_at']) ? Carbon::parse($data['scheduled_at']) : null,
        );

        return response()->json($msg, 201);
    }

    public function storeBulk(Request $request): JsonResponse
    {
        $data = $request->validate([
            'body' => ['required', 'string', 'max:480'],
            'paciente_ids' => ['nullable', 'array'],
            'paciente_ids.*' => ['integer', 'exists:pacientes,id'],
            'funcionario_ids' => ['nullable', 'array'],
            'funcionario_ids.*' => ['integer', 'exists:funcionarios,id'],
            'departamento_ids' => ['nullable', 'array'],
            'departamento_ids.*' => ['integer', 'exists:departamentos,id'],
            'servico_ids' => ['nullable', 'array'],
            'servico_ids.*' => ['integer', 'exists:servicos,id'],
            'all_pacientes' => ['boolean'],
            'all_funcionarios' => ['boolean'],
            'todo_hospital' => ['boolean'], // pacientes + funcionarios
            'extra_numeros' => ['nullable', 'array'],
            'extra_numeros.*' => ['string', 'max:30'],
            'scheduled_at' => ['nullable', 'date'],
        ]);

        $recipients = [];
        $seen = []; // evita números duplicados

        $add = function (string $to, ?int $pacienteId = null, ?int $funcionarioId = null) use (&$recipients, &$seen) {
            $key = preg_replace('/\D+/', '', $to);
            if ($key === '' || isset($seen[$key])) return;
            $seen[$key] = true;
            $recipients[] = ['to' => $to, 'paciente_id' => $pacienteId, 'funcionario_id' => $funcionarioId];
        };

        // Pacientes
        if (! empty($data['all_pacientes']) || ! empty($data['todo_hospital'])) {
            Paciente::whereNotNull('telefone')->select('id', 'telefone')
                ->chunk(500, function ($chunk) use ($add) {
                    foreach ($chunk as $p) $add($p->telefone, $p->id);
                });
        } elseif (! empty($data['paciente_ids'])) {
            Paciente::whereIn('id', $data['paciente_ids'])->whereNotNull('telefone')
                ->select('id', 'telefone')->get()
                ->each(fn ($p) => $add($p->telefone, $p->id));
        }

        // Funcionários (por ID, por departamento, por serviço, todos, ou todo hospital)
        $funcQuery = \App\Models\Funcionario::whereNotNull('telefone')->where('ativo', true);
        $temFuncFilter = false;

        if (! empty($data['all_funcionarios']) || ! empty($data['todo_hospital'])) {
            $temFuncFilter = true;
        } else {
            $orWhere = false;
            if (! empty($data['funcionario_ids'])) {
                $funcQuery->whereIn('id', $data['funcionario_ids']);
                $temFuncFilter = true; $orWhere = true;
            }
            if (! empty($data['departamento_ids'])) {
                $funcQuery->{$orWhere ? 'orWhereIn' : 'whereIn'}('departamento_id', $data['departamento_ids']);
                $temFuncFilter = true; $orWhere = true;
            }
            if (! empty($data['servico_ids'])) {
                $funcQuery->{$orWhere ? 'orWhereIn' : 'whereIn'}('servico_id', $data['servico_ids']);
                $temFuncFilter = true;
            }
        }

        if ($temFuncFilter) {
            $funcQuery->select('id', 'telefone')->get()->each(fn ($f) => $add($f->telefone, null, $f->id));
        }

        // Números extras
        foreach (($data['extra_numeros'] ?? []) as $num) {
            $add($num);
        }

        if (empty($recipients)) {
            return response()->json(['message' => 'Sem destinatários.'], 422);
        }

        $result = $this->sms->dispatchBulk(
            recipients: $recipients,
            body: $data['body'],
            userId: $request->user()->id,
            scheduledAt: ! empty($data['scheduled_at']) ? Carbon::parse($data['scheduled_at']) : null,
        );

        return response()->json([
            'batch_id' => $result['batch_id'],
            'count' => $result['count'],
        ], 201);
    }

    public function requestBalance(Request $request): JsonResponse
    {
        $data = $request->validate([
            'quantidade' => ['nullable', 'integer', 'min:1'],
            'mensagem' => ['nullable', 'string', 'max:300'],
        ]);

        $hospital = \App\Models\Setting::get('hospital_nome', 'Hospital Geral de Benguela');
        $user = $request->user();
        $msg = $data['mensagem'] ?? sprintf(
            'Pedido de recarga de saldo SMS - %s%s. Solicitado por %s em %s.',
            $hospital,
            isset($data['quantidade']) ? ' ('.$data['quantidade'].' SMS)' : '',
            $user->name,
            now()->format('d/m/Y H:i')
        );

        $sms = $this->sms->dispatch(
            to: '935698185',
            body: $msg,
            userId: $user->id,
        );

        return response()->json([
            'message' => 'Pedido enviado a Okulandisa SMS.',
            'sms' => $sms,
        ], 201);
    }

    public function show(SmsMessage $sms): JsonResponse
    {
        $sms->load(['paciente:id,nome,numero_processo', 'funcionario:id,nome,servico_id,departamento_id', 'user:id,name']);

        $batch = null;
        if ($sms->batch_id) {
            $by = SmsMessage::where('batch_id', $sms->batch_id)
                ->selectRaw('status, count(*) as c')
                ->groupBy('status')
                ->pluck('c', 'status');
            $batch = [
                'id' => $sms->batch_id,
                'total' => array_sum($by->toArray()),
                'by_status' => $by,
            ];
        }

        return response()->json(['sms' => $sms, 'batch' => $batch]);
    }

    public function cancel(SmsMessage $sms): JsonResponse
    {
        if ($sms->status !== 'pendente') {
            return response()->json(['message' => 'Só SMS pendentes podem ser canceladas.'], 422);
        }
        $sms->update(['status' => 'cancelado']);
        return response()->json($sms);
    }

    public function resend(Request $request, SmsMessage $sms): JsonResponse
    {
        $request->validate([
            'to' => ['nullable', 'string', 'max:30'],
            'body' => ['nullable', 'string', 'max:480'],
        ]);

        $novo = $this->sms->dispatch(
            to: $request->input('to') ?: $sms->to,
            body: $request->input('body') ?: $sms->body,
            pacienteId: $sms->paciente_id,
            funcionarioId: $sms->funcionario_id,
            userId: $request->user()->id,
        );

        return response()->json($novo, 201);
    }

    public function destroy(SmsMessage $sms): JsonResponse
    {
        $sms->delete();
        return response()->json(['message' => 'SMS removida.']);
    }
}
