<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Funcionario;
use App\Models\Medico;
use App\Models\Setting;
use App\Models\User;
use App\Services\Sms\SmsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class RegistrationController extends Controller
{
    public function __construct(private SmsService $sms) {}

    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'tipo'        => ['required', Rule::in(['medico', 'funcionario'])],
            'name'        => ['required', 'string', 'max:200'],
            'email'       => ['required', 'email', 'max:200', 'unique:users,email'],
            'password'    => ['required', 'string', 'min:6'],
            'telefone'    => ['nullable', 'string', 'max:30'],

            // médico-specific
            'numero_ordem'  => ['required_if:tipo,medico', 'nullable', 'string', 'max:50'],
            'especialidade' => ['required_if:tipo,medico', 'nullable', 'string', 'max:120'],

            // funcionário-specific
            'bi'              => ['required_if:tipo,funcionario', 'nullable', 'string', 'max:30'],
            'departamento_id' => ['nullable', 'integer', 'exists:departamentos,id'],
            'servico_id'      => ['nullable', 'integer', 'exists:servicos,id'],
            'cargo'           => ['nullable', 'string', 'max:120'],
        ]);

        $medicoId = null;
        if ($data['tipo'] === 'medico') {
            $medico = Medico::create([
                'nome'          => $data['name'],
                'numero_ordem'  => $data['numero_ordem'] ?? null,
                'especialidade' => $data['especialidade'] ?? null,
                'telefone'      => $data['telefone'] ?? null,
                'email'         => $data['email'],
            ]);
            $medicoId = $medico->id;
        } else {
            Funcionario::create([
                'nome'            => $data['name'],
                'bi'              => $data['bi'] ?? null,
                'telefone'        => $data['telefone'] ?? null,
                'email'           => $data['email'],
                'cargo'           => $data['cargo'] ?? null,
                'departamento_id' => $data['departamento_id'] ?? null,
                'servico_id'      => $data['servico_id'] ?? null,
            ]);
        }

        $user = User::create([
            'name'                => $data['name'],
            'email'               => $data['email'],
            'password'            => Hash::make($data['password']),
            'medico_id'           => $medicoId,
            'ativo'               => false,
            'registration_status' => 'pending',
            'requested_role'      => $data['tipo'],
        ]);

        $this->notifyAdmins($user, $data['tipo']);

        return response()->json([
            'message' => 'Registo submetido. Aguarde aprovação do administrador.',
            'user'    => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email],
        ], 201);
    }

    private function notifyAdmins(User $newUser, string $tipo): void
    {
        if (! Setting::get('notify_admin_new_registration_enabled', '1')) return;

        $tpl = Setting::get(
            'notify_admin_new_registration_template',
            'HGB: Novo registo pendente de {tipo} - {nome} ({email}). Aceda ao sistema para aprovar.'
        );

        $message = strtr($tpl, [
            '{tipo}'  => $tipo,
            '{nome}'  => $newUser->name,
            '{email}' => $newUser->email,
        ]);

        $admins = User::role('admin')->whereNotNull('id')->get();
        foreach ($admins as $admin) {
            $phone = $admin->medico?->telefone;
            if (! $phone) continue;
            $this->sms->dispatch(to: $phone, body: $message);
        }
    }
}
