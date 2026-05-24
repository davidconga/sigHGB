<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Funcionario;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FuncionarioController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Funcionario::query();

        if ($s = $request->string('search')->trim()->value()) {
            $query->where(function ($q) use ($s) {
                $q->where('nome', 'like', "%{$s}%")
                    ->orWhere('telefone', 'like', "%{$s}%")
                    ->orWhere('email', 'like', "%{$s}%")
                    ->orWhere('servico', 'like', "%{$s}%");
            });
        }
        if ($request->boolean('apenas_ativos')) $query->where('ativo', true);
        if ($mes = $request->integer('mes_aniversario')) {
            $query->whereRaw("strftime('%m', data_nascimento) = ?", [str_pad($mes, 2, '0', STR_PAD_LEFT)]);
        }

        return response()->json($query->orderBy('nome')->paginate($request->integer('per_page', 20)));
    }

    public function store(Request $request): JsonResponse
    {
        return response()->json(Funcionario::create($this->validated($request)), 201);
    }

    public function show(Funcionario $funcionario): JsonResponse
    {
        $funcionario->load(['departamento:id,nome', 'servicoRel:id,nome,departamento_id']);

        $sms = \App\Models\SmsMessage::where('funcionario_id', $funcionario->id)
            ->latest()->limit(30)->get();

        return response()->json([
            'funcionario' => $funcionario,
            'sms_count' => \App\Models\SmsMessage::where('funcionario_id', $funcionario->id)->count(),
            'sms_recentes' => $sms,
        ]);
    }

    public function update(Request $request, Funcionario $funcionario): JsonResponse
    {
        $funcionario->update($this->validated($request));
        return response()->json($funcionario->fresh());
    }

    public function destroy(Funcionario $funcionario): JsonResponse
    {
        $funcionario->delete();
        return response()->json(['message' => 'Funcionário removido.']);
    }

    public function aniversariantes(Request $request): JsonResponse
    {
        $mes = $request->integer('mes', (int) now()->format('m'));

        $list = Funcionario::whereNotNull('data_nascimento')
            ->where('ativo', true)
            ->whereRaw("strftime('%m', data_nascimento) = ?", [str_pad($mes, 2, '0', STR_PAD_LEFT)])
            ->orderByRaw("strftime('%d', data_nascimento)")
            ->get();

        return response()->json([
            'mes' => $mes,
            'total' => $list->count(),
            'funcionarios' => $list,
        ]);
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'nome' => ['required', 'string', 'max:255'],
            'telefone' => ['required', 'string', 'max:30'],
            'sexo' => ['nullable', 'in:M,F'],
            'email' => ['nullable', 'email'],
            'data_nascimento' => ['nullable', 'date'],
            'servico' => ['nullable', 'string', 'max:120'],
            'categoria' => ['nullable', 'string', 'max:120'],
            'chefe_departamento' => ['boolean'],
            'chefe_servico' => ['boolean'],
            'ativo' => ['boolean'],
            'receber_aniversario' => ['boolean'],
        ]);
    }
}
