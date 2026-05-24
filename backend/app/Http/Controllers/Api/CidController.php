<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cid;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CidController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Cid::query();

        if ($search = $request->string('search')->trim()->value()) {
            $query->where(function ($q) use ($search) {
                $q->where('codigo', 'like', "{$search}%")
                    ->orWhere('descricao', 'like', "%{$search}%");
            });
        }

        if ($request->boolean('apenas_ativos')) {
            $query->where('ativo', true);
        }

        $perPage = $request->integer('per_page', 20);

        if ($request->boolean('todos')) {
            return response()->json($query->orderBy('codigo')->limit(50)->get());
        }

        return response()->json($query->orderBy('codigo')->paginate($perPage));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules());

        return response()->json(Cid::create($data), 201);
    }

    public function show(Cid $cid): JsonResponse
    {
        return response()->json($cid);
    }

    public function update(Request $request, Cid $cid): JsonResponse
    {
        $data = $request->validate($this->rules($cid->id));
        $cid->update($data);

        return response()->json($cid);
    }

    public function destroy(Cid $cid): JsonResponse
    {
        $cid->delete();

        return response()->json(['message' => 'CID removido.']);
    }

    private function rules(?int $id = null): array
    {
        return [
            'codigo' => ['required', 'string', 'max:10', 'unique:cids,codigo' . ($id ? ",{$id}" : '')],
            'descricao' => ['required', 'string', 'max:255'],
            'capitulo' => ['nullable', 'string', 'max:255'],
            'ativo' => ['boolean'],
        ];
    }
}
