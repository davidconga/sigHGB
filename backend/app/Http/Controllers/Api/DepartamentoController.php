<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Departamento;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DepartamentoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Departamento::withCount(['servicos', 'funcionarios']);
        if ($s = $request->string('search')->trim()->value()) {
            $query->where('nome', 'like', "%{$s}%");
        }
        if ($request->boolean('with_servicos')) {
            $query->with('servicos');
        }
        return response()->json($query->orderBy('nome')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nome' => ['required', 'string', 'max:255', 'unique:departamentos,nome'],
        ]);
        return response()->json(Departamento::create($data), 201);
    }

    public function update(Request $request, Departamento $departamento): JsonResponse
    {
        $data = $request->validate([
            'nome' => ['required', 'string', 'max:255', 'unique:departamentos,nome,'.$departamento->id],
        ]);
        $departamento->update($data);
        return response()->json($departamento);
    }

    public function destroy(Departamento $departamento): JsonResponse
    {
        $departamento->delete();
        return response()->json(['message' => 'Departamento removido.']);
    }
}
