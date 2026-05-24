<?php

namespace App\Services\Sms;

use Illuminate\Support\Facades\Log;

class LogSmsDriver implements SmsDriver
{
    public function send(string $to, string $body): array
    {
        Log::info("[SMS-LOG] -> {$to} | {$body}");
        return ['ok' => true, 'provider_id' => 'LOG-'.uniqid(), 'error' => null];
    }

    public function name(): string
    {
        return 'log';
    }
}
