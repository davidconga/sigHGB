<?php

namespace App\Services\Sms;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Driver para TelcoSMS (Angola).
 *
 * API:
 *   POST https://www.telcosms.co.ao/send_message
 *   Body JSON:
 *   {
 *     "message": {
 *       "api_key_app": "prd...",
 *       "phone_number": "9XXXXXXXX",     // 9 dígitos, sem prefixo
 *       "message_body": "..."
 *     }
 *   }
 *
 * Resposta sucesso: {"status":"200 - Mensagem enviada com sucesso", "mensagem": {...}}
 *
 * Configurar via .env:
 *   SMS_DRIVER=telcosms
 *   TELCOSMS_URL=https://www.telcosms.co.ao/send_message
 *   TELCOSMS_KEY=prd...
 */
class TelcoSmsDriver implements SmsDriver
{
    public function __construct(
        private string $url,
        private string $username, // não usado
        private string $key,
        private string $sender,   // não usado pela API
    ) {}

    public function send(string $to, string $body): array
    {
        try {
            $response = Http::timeout(20)
                ->acceptJson()
                ->asJson()
                ->post($this->url, [
                    'message' => [
                        'api_key_app' => $this->key,
                        'phone_number' => $this->normalizePhone($to),
                        'message_body' => $body,
                    ],
                ]);

            $bodyResp = trim($response->body());

            if (! $response->successful()) {
                return [
                    'ok' => false,
                    'provider_id' => null,
                    'error' => "HTTP {$response->status()}: {$bodyResp}",
                ];
            }

            $data = $response->json();
            $status = $data['status'] ?? '';
            $ok = str_starts_with(trim($status), '200');

            return [
                'ok' => $ok,
                'provider_id' => $data['id'] ?? $data['message_id'] ?? null,
                'error' => $ok ? null : ($status ?: $bodyResp),
            ];
        } catch (\Throwable $e) {
            Log::error('TelcoSMS exception: '.$e->getMessage());
            return ['ok' => false, 'provider_id' => null, 'error' => $e->getMessage()];
        }
    }

    public function name(): string
    {
        return 'telcosms';
    }

    public function balance(): array
    {
        try {
            $response = Http::timeout(15)->get('https://www.telcosms.co.ao/api/v2/check_balance', [
                'api_key_app' => $this->key,
            ]);
            if (! $response->successful()) {
                return ['ok' => false, 'error' => 'HTTP '.$response->status()];
            }
            $data = $response->json();
            $info = $data['company_info'] ?? [];
            return [
                'ok' => true,
                'name' => $info['name'] ?? null,
                'email' => $info['email'] ?? null,
                'sms_available' => $info['sms_available'] ?? null,
                'sms_sent' => $info['sms_sent'] ?? null,
                'plan_expired' => ($info['plan_expirad'] ?? 'no') === 'yes',
                'can_send_without_balance' => ($info['can_send_without_balance'] ?? 'no') === 'yes',
            ];
        } catch (\Throwable $e) {
            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Normaliza para 9 dígitos (formato local Angola), removendo prefixo 244 ou +244.
     */
    private function normalizePhone(string $phone): string
    {
        $digits = preg_replace('/\D+/', '', $phone);
        if (str_starts_with($digits, '244') && strlen($digits) > 9) {
            $digits = substr($digits, 3);
        }
        return $digits;
    }
}
