<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Alta;
use App\Models\Atestado;
use App\Models\Consulta;
use App\Models\Exame;
use Illuminate\Http\JsonResponse;

class VerificacaoController extends Controller
{
    public function show(string $codigo): JsonResponse
    {
        $codigo = strtoupper($codigo);

        $documento = Consulta::where('codigo_verificacao', $codigo)->first()
            ?? Exame::where('codigo_verificacao', $codigo)->first()
            ?? Atestado::where('codigo_verificacao', $codigo)->first()
            ?? Alta::where('codigo_verificacao', $codigo)->first();

        if (! $documento) {
            return response()->json(['message' => 'Código de verificação inválido.'], 404);
        }

        $documento->load(['paciente:id,nome,numero_processo', 'medico:id,nome,numero_ordem,especialidade']);

        return response()->json([
            'tipo' => class_basename($documento),
            'numero' => $documento->numero,
            'status' => $documento->status,
            'paciente' => $documento->paciente,
            'medico' => $documento->medico,
            'emitido_em' => $documento->created_at,
        ]);
    }
}
