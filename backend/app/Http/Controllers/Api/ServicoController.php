<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Servico;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServicoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Servico::with('departamento:id,nome')->withCount('funcionarios');
        if ($s = $request->string('search')->trim()->value()) {
            $query->where('nome', 'like', "%{$s}%");
        }
        if ($depId = $request->integer('departamento_id')) {
            $query->where('departamento_id', $depId);
        }
        return response()->json($query->orderBy('nome')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nome' => ['required', 'string', 'max:255'],
            'departamento_id' => ['required', 'exists:departamentos,id'],
        ]);
        return response()->json(Servico::create($data)->load('departamento'), 201);
    }

    public function update(Request $request, Servico $servico): JsonResponse
    {
        $data = $request->validate([
            'nome' => ['required', 'string', 'max:255'],
            'departamento_id' => ['required', 'exists:departamentos,id'],
        ]);
        $servico->update($data);
        return response()->json($servico->fresh()->load('departamento'));
    }

    public function destroy(Servico $servico): JsonResponse
    {
        $servico->delete();
        return response()->json(['message' => 'Serviço removido.']);
    }
}
