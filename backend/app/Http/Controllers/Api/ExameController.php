<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Exame;
use App\Support\MedicoScope;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class ExameController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = MedicoScope::apply(Exame::with(['paciente:id,nome,numero_processo', 'medico:id,nome,especialidade']));

        if ($pid = $request->integer('paciente_id')) {
            $query->where('paciente_id', $pid);
        }
        if ($tipo = $request->string('tipo_exame')->value()) {
            $query->where('tipo_exame', 'like', "%{$tipo}%");
        }
        if ($status = $request->string('status')->value()) {
            $query->where('status', $status);
        }

        return response()->json(
            $query->latest('data_realizacao')->paginate($request->integer('per_page', 15))
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'paciente_id' => ['required', 'exists:pacientes,id'],
            'medico_id' => ['required', 'exists:medicos,id'],
            'data_realizacao' => ['required', 'date'],
            'tipo_exame' => ['required', 'string', 'max:120'],
            'material' => ['nullable', 'string'],
            'parametros' => ['nullable', 'array'],
            'resultado' => ['required', 'string'],
            'interpretacao' => ['nullable', 'string'],
            'observacoes' => ['nullable', 'string'],
            'status' => ['nullable', 'in:rascunho,emitido,anulado'],
        ]);

        $exame = Exame::create($data);

        return response()->json($exame->load(['paciente', 'medico']), 201);
    }

    public function show(Exame $exame): JsonResponse
    {
        $this->guard($exame);
        return response()->json($exame->load(['paciente', 'medico']));
    }

    private function guard(Exame $e): void
    {
        if (! MedicoScope::canAccess($e)) {
            throw new AccessDeniedHttpException('Sem acesso a este exame.');
        }
    }

    public function update(Request $request, Exame $exame): JsonResponse
    {
        $this->guard($exame);
        $data = $request->validate([
            'data_realizacao' => ['sometimes', 'date'],
            'tipo_exame' => ['sometimes', 'required', 'string'],
            'material' => ['nullable', 'string'],
            'parametros' => ['nullable', 'array'],
            'resultado' => ['sometimes', 'required', 'string'],
            'interpretacao' => ['nullable', 'string'],
            'observacoes' => ['nullable', 'string'],
            'status' => ['nullable', 'in:rascunho,emitido,anulado'],
        ]);

        $exame->update($data);

        return response()->json($exame->load(['paciente', 'medico']));
    }

    public function destroy(Exame $exame): JsonResponse
    {
        $this->guard($exame);
        $exame->delete();

        return response()->json(['message' => 'Exame removido.']);
    }

    public function pdf(Exame $exame): Response
    {
        $this->guard($exame);
        $exame->load(['paciente', 'medico']);
        $pdf = Pdf::loadView('pdf.exame', ['exame' => $exame]);

        return $pdf->stream("exame-{$exame->numero}.pdf");
    }
}
