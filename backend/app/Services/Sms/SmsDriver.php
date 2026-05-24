<?php

namespace App\Services\Sms;

interface SmsDriver
{
    /**
     * Envia um SMS. Devolve ['ok' => bool, 'provider_id' => ?string, 'error' => ?string].
     */
    public function send(string $to, string $body): array;

    public function name(): string;
}
