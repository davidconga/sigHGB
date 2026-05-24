<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Setting::orderBy('chave')->get());
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'settings' => ['required', 'array'],
            'settings.*.chave' => ['required', 'string'],
            'settings.*.valor' => ['nullable', 'string'],
        ]);

        foreach ($data['settings'] as $s) {
            Setting::set($s['chave'], $s['valor'] ?? null);
        }

        return response()->json(['message' => 'Configurações guardadas.', 'settings' => Setting::orderBy('chave')->get()]);
    }
}
