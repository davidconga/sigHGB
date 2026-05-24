<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt($data)) {
            throw ValidationException::withMessages([
                'email' => ['Credenciais inválidas.'],
            ]);
        }

        $user = User::with('medico')->find(Auth::id());

        if ($user->registration_status === 'pending') {
            Auth::logout();
            throw ValidationException::withMessages([
                'email' => ['O seu registo aguarda aprovação do administrador.'],
            ]);
        }

        if ($user->registration_status === 'rejected') {
            Auth::logout();
            throw ValidationException::withMessages([
                'email' => ['O seu pedido de registo foi rejeitado.'],
            ]);
        }

        if (! $user->ativo) {
            Auth::logout();
            throw ValidationException::withMessages([
                'email' => ['Conta desativada. Contacte o administrador.'],
            ]);
        }

        $token = $user->createToken('hgb-api')->plainTextToken;

        return response()->json([
            'user' => $this->userPayload($user),
            'token' => $token,
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json($this->userPayload($request->user()->load('medico')));
    }

    private function userPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'ativo' => $user->ativo,
            'medico_id' => $user->medico_id,
            'medico' => $user->medico,
            'roles' => $user->getRoleNames(),
            'permissions' => $user->getAllPermissions()->pluck('name'),
        ];
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Sessão terminada.']);
    }
}
