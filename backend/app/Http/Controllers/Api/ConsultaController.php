<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Consulta;
use App\Support\MedicoScope;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class ConsultaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = MedicoScope::apply(Consulta::with(['paciente:id,nome,numero_processo', 'medico:id,nome,especialidade']));

        if ($pid = $request->integer('paciente_id')) {
            $query->where('paciente_id', $pid);
        }
        if ($mid = $request->integer('medico_id')) {
            $query->where('medico_id', $mid);
        }
        if ($status = $request->string('status')->value()) {
            $query->where('status', $status);
        }

        return response()->json(
            $query->latest('data_consulta')->paginate($request->integer('per_page', 15))
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'paciente_id' => ['required', 'exists:pacientes,id'],
            'medico_id' => ['required', 'exists:medicos,id'],
            'data_consulta' => ['required', 'date'],
            'queixa_principal' => ['nullable', 'string'],
            'historia_doenca' => ['nullable', 'string'],
            'exame_fisico' => ['nullable', 'string'],
            'diagnostico' => ['required', 'string'],
            'cid' => ['nullable', 'string', 'max:10'],
            'prescricao' => ['nullable', 'string'],
            'observacoes' => ['nullable', 'string'],
            'status' => ['nullable', 'in:rascunho,emitido,anulado'],
            'agendamento_id' => ['nullable', 'exists:agendamentos,id'],
        ]);

        $agendamentoId = $data['agendamento_id'] ?? null;
        unset($data['agendamento_id']);

        $consulta = Consulta::create($data);

        if ($agendamentoId) {
            $ag = \App\Models\Agendamento::find($agendamentoId);
            if ($ag && $ag->paciente_id === (int) $data['paciente_id']) {
                $ag->update([
                    'consulta_id' => $consulta->id,
                    'status'      => 'realizada',
                ]);
            }
        }

        return response()->json($consulta->load(['paciente', 'medico']), 201);
    }

    public function show(Consulta $consulta): JsonResponse
    {
        $this->guard($consulta);
        return response()->json($consulta->load(['paciente', 'medico']));
    }

    private function guard(Consulta $c): void
    {
        if (! MedicoScope::canAccess($c)) {
            throw new AccessDeniedHttpException('Sem acesso a esta consulta.');
        }
    }

    public function update(Request $request, Consulta $consulta): JsonResponse
    {
        $this->guard($consulta);
        $data = $request->validate([
            'data_consulta' => ['sometimes', 'date'],
            'queixa_principal' => ['nullable', 'string'],
            'historia_doenca' => ['nullable', 'string'],
            'exame_fisico' => ['nullable', 'string'],
            'diagnostico' => ['sometimes', 'required', 'string'],
            'cid' => ['nullable', 'string', 'max:10'],
            'prescricao' => ['nullable', 'string'],
            'observacoes' => ['nullable', 'string'],
            'status' => ['nullable', 'in:rascunho,emitido,anulado'],
        ]);

        $consulta->update($data);

        return response()->json($consulta->load(['paciente', 'medico']));
    }

    public function destroy(Consulta $consulta): JsonResponse
    {
        $this->guard($consulta);
        $consulta->delete();

        return response()->json(['message' => 'Consulta removida.']);
    }

    public function pdf(Consulta $consulta): Response
    {
        $this->guard($consulta);
        $consulta->load(['paciente', 'medico']);
        $pdf = Pdf::loadView('pdf.consulta', ['consulta' => $consulta]);

        return $pdf->stream("consulta-{$consulta->numero}.pdf");
    }
}
