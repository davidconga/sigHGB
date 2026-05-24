<?php

namespace App\Services\Notifications;

use App\Models\UserDevice;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Canal Push usando a API gratuita do Expo.
 * https://docs.expo.dev/push-notifications/sending-notifications/
 *
 * Aceita tokens no formato "ExponentPushToken[xxx...]"
 */
class PushChannel
{
    private const ENDPOINT = 'https://exp.host/--/api/v2/push/send';

    /**
     * Envia push a todos os dispositivos de um utilizador.
     * Devolve número de devices que receberam (best-effort).
     */
    public function sendToUser(int $userId, string $title, string $body, array $data = []): int
    {
        $tokens = UserDevice::where('user_id', $userId)->pluck('push_token')->all();
        if (empty($tokens)) return 0;

        $messages = array_map(fn ($token) => [
            'to' => $token,
            'title' => $title,
            'body' => $body,
            'data' => $data,
            'sound' => 'default',
            'priority' => 'high',
            'channelId' => 'default',
        ], $tokens);

        try {
            $response = Http::timeout(10)
                ->acceptJson()
                ->asJson()
                ->post(self::ENDPOINT, $messages);

            if (! $response->successful()) {
                Log::warning("Expo push HTTP {$response->status()}: ".$response->body());
                return 0;
            }
            return count($tokens);
        } catch (\Throwable $e) {
            Log::error('Expo push exception: '.$e->getMessage());
            return 0;
        }
    }
}
