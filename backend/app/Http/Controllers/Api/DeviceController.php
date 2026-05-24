<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserDevice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeviceController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'push_token' => ['required', 'string', 'max:255'],
            'platform' => ['nullable', 'string', 'max:20'],
            'device_name' => ['nullable', 'string', 'max:255'],
        ]);

        $device = UserDevice::updateOrCreate(
            ['push_token' => $data['push_token']],
            [
                'user_id' => $request->user()->id,
                'platform' => $data['platform'] ?? null,
                'device_name' => $data['device_name'] ?? null,
                'last_seen_at' => now(),
            ]
        );

        return response()->json($device);
    }

    public function unregister(Request $request): JsonResponse
    {
        $data = $request->validate(['push_token' => ['required', 'string']]);
        UserDevice::where('user_id', $request->user()->id)
            ->where('push_token', $data['push_token'])
            ->delete();
        return response()->json(['message' => 'Dispositivo removido.']);
    }
}
