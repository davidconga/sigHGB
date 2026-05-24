<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Paciente;
use App\Models\PacienteAnexo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class PacienteAnexoController extends Controller
{
    public function index(Paciente $paciente): JsonResponse
    {
        return response()->json(
            $paciente->anexos()->with('uploader:id,name')->latest()->get()
        );
    }

    public function store(Request $request, Paciente $paciente): JsonResponse
    {
        $data = $request->validate([
            'tipo'      => ['nullable', Rule::in(['bi', 'prescricao', 'exame', 'outro'])],
            'descricao' => ['nullable', 'string', 'max:255'],
            'file'      => ['required', 'file', 'max:10240', 'mimes:jpg,jpeg,png,heic,heif,pdf'],
        ]);

        $file = $request->file('file');
        $path = $file->store("pacientes/{$paciente->id}/anexos", 'public');

        $anexo = $paciente->anexos()->create([
            'tipo'          => $data['tipo'] ?? 'outro',
            'descricao'     => $data['descricao'] ?? null,
            'path'          => $path,
            'original_name' => $file->getClientOriginalName(),
            'mime'          => $file->getClientMimeType(),
            'size'          => $file->getSize(),
            'uploaded_by'   => $request->user()->id,
        ]);

        return response()->json($anexo->load('uploader:id,name'), 201);
    }

    public function destroy(Paciente $paciente, PacienteAnexo $anexo): JsonResponse
    {
        abort_if($anexo->paciente_id !== $paciente->id, 404);
        Storage::disk('public')->delete($anexo->path);
        $anexo->delete();
        return response()->json(['message' => 'Anexo removido.']);
    }
}
