<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AusenciaMedico;
use App\Models\DisponibilidadeMedico;
use App\Models\Medico;
use App\Services\SlotResolver;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MedicoDisponibilidadeController extends Controller
{
    public function __construct(private SlotResolver $slots) {}

    public function index(Medico $medico): JsonResponse
    {
        return response()->json([
            'disponibilidades' => DisponibilidadeMedico::with('servico:id,nome')
                ->where('medico_id', $medico->id)
                ->orderBy('dia_semana')
                ->orderBy('hora_inicio')
                ->get(),
            'ausencias' => AusenciaMedico::where('medico_id', $medico->id)
                ->where('fim', '>=', now()->subMonth())
                ->orderBy('inicio')
                ->get(),
        ]);
    }

    public function storeDisponibilidade(Request $request, Medico $medico): JsonResponse
    {
        $data = $request->validate([
            'dia_semana'      => ['required', 'integer', 'min:0', 'max:6'],
            'hora_inicio'     => ['required', 'date_format:H:i'],
            'hora_fim'        => ['required', 'date_format:H:i', 'after:hora_inicio'],
            'duracao_minutos' => ['required', 'integer', 'min:5', 'max:480'],
            'servico_id'      => ['nullable', 'exists:servicos,id'],
            'ativo'           => ['nullable', 'boolean'],
        ]);

        $data['medico_id'] = $medico->id;
        $data['ativo']     = $data['ativo'] ?? true;

        $d = DisponibilidadeMedico::create($data);
        return response()->json($d->load('servico'), 201);
    }

    public function updateDisponibilidade(Request $request, Medico $medico, DisponibilidadeMedico $disponibilidade): JsonResponse
    {
        $this->verificaPertence($medico, $disponibilidade->medico_id);

        $data = $request->validate([
            'dia_semana'      => ['sometimes', 'integer', 'min:0', 'max:6'],
            'hora_inicio'     => ['sometimes', 'date_format:H:i'],
            'hora_fim'        => ['sometimes', 'date_format:H:i'],
            'duracao_minutos' => ['sometimes', 'integer', 'min:5', 'max:480'],
            'servico_id'      => ['nullable', 'exists:servicos,id'],
            'ativo'           => ['sometimes', 'boolean'],
        ]);

        $disponibilidade->update($data);
        return response()->json($disponibilidade->load('servico'));
    }

    public function destroyDisponibilidade(Medico $medico, DisponibilidadeMedico $disponibilidade): JsonResponse
    {
        $this->verificaPertence($medico, $disponibilidade->medico_id);
        $disponibilidade->delete();
        return response()->json(['message' => 'Disponibilidade removida.']);
    }

    public function storeAusencia(Request $request, Medico $medico): JsonResponse
    {
        $data = $request->validate([
            'inicio' => ['required', 'date'],
            'fim'    => ['required', 'date', 'after_or_equal:inicio'],
            'motivo' => ['nullable', 'string', 'max:255'],
        ]);

        $data['medico_id']  = $medico->id;
        $data['criado_por'] = auth()->id();

        $a = AusenciaMedico::create($data);
        return response()->json($a, 201);
    }

    public function destroyAusencia(Medico $medico, AusenciaMedico $ausencia): JsonResponse
    {
        $this->verificaPertence($medico, $ausencia->medico_id);
        $ausencia->delete();
        return response()->json(['message' => 'Ausência removida.']);
    }

    public function slotsDoDia(Request $request, Medico $medico): JsonResponse
    {
        $data = $request->validate([
            'data' => ['required', 'date'],
        ]);

        $slots = $this->slots->slotsDoDia($medico, Carbon::parse($data['data']));

        return response()->json([
            'data'   => $data['data'],
            'medico' => ['id' => $medico->id, 'nome' => $medico->nome],
            'slots'  => $slots,
        ]);
    }

    private function verificaPertence(Medico $medico, int $childMedicoId): void
    {
        if ($medico->id !== $childMedicoId) {
            abort(404, 'Recurso não pertence a este médico.');
        }
    }
}
