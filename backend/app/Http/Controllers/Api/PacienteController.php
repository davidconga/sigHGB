<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Paciente;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PacienteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Paciente::query();

        if ($search = $request->string('search')->trim()->value()) {
            $query->where(function ($q) use ($search) {
                $q->where('nome', 'like', "%{$search}%")
                    ->orWhere('numero_processo', 'like', "%{$search}%")
                    ->orWhere('bi', 'like', "%{$search}%");
            });
        }

        return response()->json(
            $query->latest()->paginate($request->integer('per_page', 15))
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules());

        return response()->json(Paciente::create($data), 201);
    }

    public function show(Paciente $paciente): JsonResponse
    {
        $paciente->load([
            'atestados' => fn ($q) => $q->latest('data_emissao')->limit(20)->with('medico:id,nome'),
            'altas' => fn ($q) => $q->latest('data_alta')->limit(20)->with('medico:id,nome'),
            'consultas' => fn ($q) => $q->latest('data_consulta')->limit(20)->with('medico:id,nome'),
            'exames' => fn ($q) => $q->latest('data_realizacao')->limit(20)->with('medico:id,nome'),
        ]);

        $relatorios = \App\Models\Relatorio::where('paciente_id', $paciente->id)
            ->latest('data_emissao')->limit(20)->with('medico:id,nome')->get();

        $sms = \App\Models\SmsMessage::where('paciente_id', $paciente->id)
            ->latest()->limit(20)->get(['id', 'to', 'body', 'status', 'sent_at', 'created_at']);

        return response()->json([
            'paciente' => $paciente,
            'relatorios' => $relatorios,
            'sms' => $sms,
            'counts' => [
                'atestados' => $paciente->atestados()->count(),
                'altas' => $paciente->altas()->count(),
                'consultas' => $paciente->consultas()->count(),
                'exames' => $paciente->exames()->count(),
                'relatorios' => \App\Models\Relatorio::where('paciente_id', $paciente->id)->count(),
                'sms' => \App\Models\SmsMessage::where('paciente_id', $paciente->id)->count(),
            ],
        ]);
    }

    public function update(Request $request, Paciente $paciente): JsonResponse
    {
        $data = $request->validate($this->rules($paciente->id));

        $paciente->update($data);

        return response()->json($paciente);
    }

    private function rules(?int $id = null): array
    {
        return [
            'nome' => ['required', 'string', 'max:255'],
            'nome_pai' => ['nullable', 'string', 'max:255'],
            'nome_mae' => ['nullable', 'string', 'max:255'],
            'bi' => ['nullable', 'string', 'max:50', 'unique:pacientes,bi' . ($id ? ",{$id}" : '')],
            'bi_emissao_local' => ['nullable', 'string', 'max:120'],
            'bi_emissao_data' => ['nullable', 'date'],
            'data_nascimento' => ['nullable', 'date'],
            'sexo' => ['nullable', 'in:M,F'],
            'telefone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email'],
            'endereco' => ['nullable', 'string'],
            'municipio' => ['nullable', 'string'],
            'provincia' => ['nullable', 'string'],
            'naturalidade_provincia' => ['nullable', 'string', 'max:120'],
            'naturalidade_municipio' => ['nullable', 'string', 'max:120'],
            'grupo_sanguineo' => ['nullable', 'string', 'max:5'],
            'alergias' => ['nullable', 'string'],
            'observacoes' => ['nullable', 'string'],
        ];
    }

    public function destroy(Paciente $paciente): JsonResponse
    {
        $paciente->delete();

        return response()->json(['message' => 'Paciente removido.']);
    }
}
