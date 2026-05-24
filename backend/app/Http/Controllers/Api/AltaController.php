<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Alta;
use App\Support\MedicoScope;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class AltaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = MedicoScope::apply(Alta::with(['paciente:id,nome,numero_processo', 'medico:id,nome,especialidade']));

        if ($pid = $request->integer('paciente_id')) {
            $query->where('paciente_id', $pid);
        }
        if ($cond = $request->string('condicao_alta')->value()) {
            $query->where('condicao_alta', $cond);
        }
        if ($status = $request->string('status')->value()) {
            $query->where('status', $status);
        }

        return response()->json(
            $query->latest('data_alta')->paginate($request->integer('per_page', 15))
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'paciente_id' => ['required', 'exists:pacientes,id'],
            'medico_id' => ['required', 'exists:medicos,id'],
            'data_internamento' => ['required', 'date'],
            'data_alta' => ['required', 'date', 'after_or_equal:data_internamento'],
            'servico' => ['nullable', 'string'],
            'cama' => ['nullable', 'string'],
            'diagnostico_admissao' => ['nullable', 'string'],
            'diagnostico_alta' => ['required', 'string'],
            'cid' => ['nullable', 'string', 'max:10'],
            'procedimentos' => ['nullable', 'string'],
            'evolucao' => ['nullable', 'string'],
            'medicacao_alta' => ['nullable', 'string'],
            'recomendacoes' => ['nullable', 'string'],
            'condicao_alta' => ['required', 'in:curado,melhorado,transferido,obito,desistencia'],
            'status' => ['nullable', 'in:rascunho,emitido,anulado'],
        ]);

        $alta = Alta::create($data);

        return response()->json($alta->load(['paciente', 'medico']), 201);
    }

    public function show(Alta $alta): JsonResponse
    {
        $this->guard($alta);
        return response()->json($alta->load(['paciente', 'medico']));
    }

    private function guard(Alta $a): void
    {
        if (! MedicoScope::canAccess($a)) {
            throw new AccessDeniedHttpException('Sem acesso a esta alta.');
        }
    }

    public function update(Request $request, Alta $alta): JsonResponse
    {
        $this->guard($alta);
        $data = $request->validate([
            'data_internamento' => ['sometimes', 'date'],
            'data_alta' => ['sometimes', 'date', 'after_or_equal:data_internamento'],
            'servico' => ['nullable', 'string'],
            'cama' => ['nullable', 'string'],
            'diagnostico_admissao' => ['nullable', 'string'],
            'diagnostico_alta' => ['sometimes', 'required', 'string'],
            'cid' => ['nullable', 'string', 'max:10'],
            'procedimentos' => ['nullable', 'string'],
            'evolucao' => ['nullable', 'string'],
            'medicacao_alta' => ['nullable', 'string'],
            'recomendacoes' => ['nullable', 'string'],
            'condicao_alta' => ['sometimes', 'in:curado,melhorado,transferido,obito,desistencia'],
            'status' => ['nullable', 'in:rascunho,emitido,anulado'],
        ]);

        $alta->update($data);

        return response()->json($alta->load(['paciente', 'medico']));
    }

    public function destroy(Alta $alta): JsonResponse
    {
        $this->guard($alta);
        $alta->delete();

        return response()->json(['message' => 'Alta removida.']);
    }

    public function pdf(Alta $alta): Response
    {
        $this->guard($alta);
        $alta->load(['paciente', 'medico']);
        $pdf = Pdf::loadView('pdf.alta', ['alta' => $alta]);

        return $pdf->stream("alta-{$alta->numero}.pdf");
    }
}
