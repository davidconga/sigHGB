<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Alta;
use App\Models\Atestado;
use App\Models\Consulta;
use App\Models\Exame;
use App\Models\Funcionario;
use App\Models\Medico;
use App\Models\Paciente;
use App\Models\Relatorio;
use App\Models\SmsMessage;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function stats(): JsonResponse
    {
        return response()->json([
            'counts' => $this->counts(),
            'atestados_por_mes' => $this->atestadosPorMes(),
            'relatorios_por_tipo' => $this->relatoriosPorTipo(),
            'atestados_por_efeito' => $this->atestadosPorEfeito(),
            'sms_por_dia' => $this->smsPorDia(),
            'aniversariantes_proximos' => $this->aniversariantesProximos(),
            'rascunhos_pendentes' => $this->rascunhosPendentes(),
        ]);
    }

    private function counts(): array
    {
        return [
            'pacientes' => Paciente::count(),
            'medicos' => Medico::where('ativo', true)->count(),
            'funcionarios' => Funcionario::where('ativo', true)->count(),
            'atestados' => Atestado::count(),
            'atestados_emitidos' => Atestado::where('status', 'emitido')->count(),
            'relatorios' => Relatorio::count(),
            'relatorios_emitidos' => Relatorio::where('status', 'emitido')->count(),
            'consultas' => Consulta::count(),
            'exames' => Exame::count(),
            'altas' => Alta::count(),
            'sms_enviados' => SmsMessage::where('status', 'enviado')->count(),
            'sms_pendentes' => SmsMessage::where('status', 'pendente')->count(),
        ];
    }

    private function atestadosPorMes(): array
    {
        $start = now()->subMonths(11)->startOfMonth();

        $raw = Atestado::selectRaw("strftime('%Y-%m', data_emissao) as mes, count(*) as total")
            ->where('data_emissao', '>=', $start)
            ->groupBy('mes')
            ->pluck('total', 'mes');

        $result = [];
        for ($i = 0; $i < 12; $i++) {
            $m = $start->copy()->addMonths($i);
            $key = $m->format('Y-m');
            $result[] = [
                'mes' => $m->isoFormat('MMM/YY'),
                'total' => (int) ($raw[$key] ?? 0),
            ];
        }
        return $result;
    }

    private function relatoriosPorTipo(): array
    {
        $labels = Relatorio::TIPOS;
        return Relatorio::selectRaw('tipo, count(*) as total')
            ->groupBy('tipo')
            ->get()
            ->map(fn ($r) => [
                'tipo' => $labels[$r->tipo] ?? $r->tipo,
                'total' => (int) $r->total,
            ])
            ->sortByDesc('total')
            ->values()
            ->all();
    }

    private function atestadosPorEfeito(): array
    {
        return Atestado::selectRaw('COALESCE(destino, "(sem efeito)") as efeito, count(*) as total')
            ->groupBy('efeito')
            ->orderByDesc('total')
            ->limit(10)
            ->get()
            ->map(fn ($a) => ['efeito' => $a->efeito, 'total' => (int) $a->total])
            ->all();
    }

    private function smsPorDia(): array
    {
        $start = now()->subDays(6)->startOfDay();

        $raw = SmsMessage::selectRaw("strftime('%Y-%m-%d', created_at) as dia, count(*) as total")
            ->where('created_at', '>=', $start)
            ->groupBy('dia')
            ->pluck('total', 'dia');

        $result = [];
        for ($i = 0; $i < 7; $i++) {
            $d = $start->copy()->addDays($i);
            $result[] = [
                'dia' => $d->isoFormat('DD/MM'),
                'total' => (int) ($raw[$d->format('Y-m-d')] ?? 0),
            ];
        }
        return $result;
    }

    private function aniversariantesProximos(): array
    {
        // Próximos 14 dias
        $hoje = now()->startOfDay();
        $funcionarios = Funcionario::whereNotNull('data_nascimento')
            ->where('ativo', true)
            ->get(['id', 'nome', 'telefone', 'data_nascimento']);

        $proximos = $funcionarios
            ->map(function ($f) use ($hoje) {
                $dn = $f->data_nascimento;
                $proxima = Carbon::create($hoje->year, $dn->month, $dn->day);
                if ($proxima->lt($hoje)) $proxima->addYear();
                return [
                    'id' => $f->id,
                    'nome' => $f->nome,
                    'data_nascimento' => $dn->format('d/m'),
                    'dias' => (int) $hoje->diffInDays($proxima, false),
                    'proxima_data' => $proxima->format('Y-m-d'),
                ];
            })
            ->filter(fn ($x) => $x['dias'] <= 14)
            ->sortBy('dias')
            ->values()
            ->take(10);

        return $proximos->all();
    }

    private function rascunhosPendentes(): array
    {
        return [
            'atestados' => Atestado::where('status', 'rascunho')->count(),
            'relatorios' => Relatorio::where('status', 'rascunho')->count(),
        ];
    }
}
