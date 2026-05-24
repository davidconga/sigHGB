<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::with(['roles:id,name', 'medico:id,nome,especialidade']);

        if ($search = $request->string('search')->trim()->value()) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        return response()->json($query->orderBy('name')->paginate($request->integer('per_page', 15)));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
            'roles' => ['required', 'array', 'min:1'],
            'roles.*' => ['exists:roles,name'],
            'medico_id' => ['nullable', 'exists:medicos,id'],
            'ativo' => ['boolean'],
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'medico_id' => $data['medico_id'] ?? null,
            'ativo' => $data['ativo'] ?? true,
        ]);

        $user->syncRoles($data['roles']);

        return response()->json($user->load(['roles', 'medico']), 201);
    }

    public function show(User $user): JsonResponse
    {
        return response()->json($user->load(['roles', 'medico', 'permissions']));
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => ['sometimes', 'required', 'email', 'unique:users,email,'.$user->id],
            'password' => ['nullable', 'string', 'min:6'],
            'roles' => ['sometimes', 'array', 'min:1'],
            'roles.*' => ['exists:roles,name'],
            'medico_id' => ['nullable', 'exists:medicos,id'],
            'ativo' => ['boolean'],
        ]);

        $user->fill(array_filter([
            'name' => $data['name'] ?? null,
            'email' => $data['email'] ?? null,
            'medico_id' => array_key_exists('medico_id', $data) ? $data['medico_id'] : $user->medico_id,
            'ativo' => $data['ativo'] ?? $user->ativo,
        ], fn ($v) => $v !== null));

        if (! empty($data['password'])) {
            $user->password = Hash::make($data['password']);
        }
        $user->save();

        if (! empty($data['roles'])) {
            $user->syncRoles($data['roles']);
        }

        return response()->json($user->load(['roles', 'medico']));
    }

    public function destroy(User $user): JsonResponse
    {
        if ($user->id === auth()->id()) {
            return response()->json(['message' => 'Não podes remover-te a ti próprio.'], 422);
        }
        $user->delete();
        return response()->json(['message' => 'Utilizador removido.']);
    }

    public function roles(): JsonResponse
    {
        return response()->json(Role::orderBy('name')->get(['id', 'name']));
    }
}
