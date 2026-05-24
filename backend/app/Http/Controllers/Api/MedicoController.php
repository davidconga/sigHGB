<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Medico;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MedicoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Medico::query();

        if ($search = $request->string('search')->trim()->value()) {
            $query->where(function ($q) use ($search) {
                $q->where('nome', 'like', "%{$search}%")
                    ->orWhere('numero_ordem', 'like', "%{$search}%")
                    ->orWhere('especialidade', 'like', "%{$search}%");
            });
        }

        if ($request->boolean('apenas_ativos')) {
            $query->where('ativo', true);
        }

        return response()->json(
            $query->orderBy('nome')->paginate($request->integer('per_page', 15))
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nome' => ['required', 'string', 'max:255'],
            'numero_ordem' => ['required', 'string', 'max:50', 'unique:medicos,numero_ordem'],
            'especialidade' => ['required', 'string', 'max:120'],
            'telefone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email'],
            'ativo' => ['boolean'],
        ]);

        return response()->json(Medico::create($data), 201);
    }

    public function show(Medico $medico): JsonResponse
    {
        $counts = [
            'atestados' => \App\Models\Atestado::where('medico_id', $medico->id)->count(),
            'relatorios' => \App\Models\Relatorio::where('medico_id', $medico->id)->count(),
            'consultas' => \App\Models\Consulta::where('medico_id', $medico->id)->count(),
            'exames' => \App\Models\Exame::where('medico_id', $medico->id)->count(),
            'altas' => \App\Models\Alta::where('medico_id', $medico->id)->count(),
        ];

        $atestados = \App\Models\Atestado::where('medico_id', $medico->id)
            ->with('paciente:id,nome,numero_processo')
            ->latest('data_emissao')->limit(15)->get();

        $relatorios = \App\Models\Relatorio::where('medico_id', $medico->id)
            ->with('paciente:id,nome,numero_processo')
            ->latest('data_emissao')->limit(15)->get();

        return response()->json([
            'medico' => $medico,
            'counts' => $counts,
            'atestados' => $atestados,
            'relatorios' => $relatorios,
        ]);
    }

    public function update(Request $request, Medico $medico): JsonResponse
    {
        $data = $request->validate([
            'nome' => ['sometimes', 'required', 'string', 'max:255'],
            'numero_ordem' => ['sometimes', 'required', 'string', 'max:50', 'unique:medicos,numero_ordem,' . $medico->id],
            'especialidade' => ['sometimes', 'required', 'string', 'max:120'],
            'telefone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email'],
            'ativo' => ['boolean'],
        ]);

        $medico->update($data);

        return response()->json($medico->fresh());
    }

    public function destroy(Medico $medico): JsonResponse
    {
        if ($medico->assinatura_path) Storage::disk('public')->delete($medico->assinatura_path);
        if ($medico->carimbo_path) Storage::disk('public')->delete($medico->carimbo_path);

        $medico->delete();

        return response()->json(['message' => 'Médico removido.']);
    }

    public function uploadAssinatura(Request $request, Medico $medico): JsonResponse
    {
        return $this->handleUpload($request, $medico, 'assinatura_path', 'assinatura');
    }

    public function uploadCarimbo(Request $request, Medico $medico): JsonResponse
    {
        return $this->handleUpload($request, $medico, 'carimbo_path', 'carimbo');
    }

    public function deleteAssinatura(Medico $medico): JsonResponse
    {
        return $this->handleDelete($medico, 'assinatura_path');
    }

    public function deleteCarimbo(Medico $medico): JsonResponse
    {
        return $this->handleDelete($medico, 'carimbo_path');
    }

    private function handleUpload(Request $request, Medico $medico, string $column, string $folder): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'image', 'mimes:png,jpg,jpeg,webp', 'max:2048'],
        ]);

        if ($medico->{$column}) {
            Storage::disk('public')->delete($medico->{$column});
        }

        $path = $request->file('file')->store("medicos/{$folder}", 'public');
        $medico->update([$column => $path]);

        return response()->json($medico->fresh());
    }

    private function handleDelete(Medico $medico, string $column): JsonResponse
    {
        if ($medico->{$column}) {
            Storage::disk('public')->delete($medico->{$column});
            $medico->update([$column => null]);
        }
        return response()->json($medico->fresh());
    }
}
