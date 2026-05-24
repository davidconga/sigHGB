<?php

namespace App\Services\Sms;

use App\Models\SmsMessage;
use Carbon\Carbon;
use Illuminate\Support\Str;

class SmsService
{
    public function __construct(private SmsDriver $driver) {}

    public function driverName(): string
    {
        return $this->driver->name();
    }

    /**
     * Enfileira ou envia imediatamente. Devolve a mensagem persistida.
     */
    public function dispatch(
        string $to,
        string $body,
        ?int $pacienteId = null,
        ?int $userId = null,
        ?Carbon $scheduledAt = null,
        ?string $batchId = null,
        ?int $funcionarioId = null,
    ): SmsMessage {
        $msg = SmsMessage::create([
            'to' => $to,
            'body' => $body,
            'paciente_id' => $pacienteId,
            'funcionario_id' => $funcionarioId,
            'user_id' => $userId,
            'batch_id' => $batchId,
            'status' => 'pendente',
            'scheduled_at' => $scheduledAt,
        ]);

        // Se não estiver agendado para o futuro, enviar imediatamente
        if (! $scheduledAt || $scheduledAt->lessThanOrEqualTo(now())) {
            $this->sendNow($msg);
        }

        return $msg->refresh();
    }

    public function dispatchBulk(
        array $recipients, // [['to' => '...', 'paciente_id' => ?int], ...]
        string $body,
        ?int $userId = null,
        ?Carbon $scheduledAt = null,
    ): array {
        $batchId = (string) Str::uuid();
        $messages = [];

        foreach ($recipients as $r) {
            $messages[] = $this->dispatch(
                to: $r['to'],
                body: $body,
                pacienteId: $r['paciente_id'] ?? null,
                userId: $userId,
                scheduledAt: $scheduledAt,
                batchId: $batchId,
                funcionarioId: $r['funcionario_id'] ?? null,
            );
        }

        return ['batch_id' => $batchId, 'count' => count($messages), 'messages' => $messages];
    }

    public function sendNow(SmsMessage $msg): void
    {
        $result = $this->driver->send($msg->to, $msg->body);
        $msg->update([
            'status' => $result['ok'] ? 'enviado' : 'falhado',
            'sent_at' => now(),
            'provider' => $this->driver->name(),
            'provider_message_id' => $result['provider_id'] ?? null,
            'error' => $result['error'] ?? null,
        ]);
    }

    /**
     * Processa SMS agendadas que estejam vencidas. Para usar em cron.
     */
    public function dispatchDuePending(): int
    {
        $due = SmsMessage::where('status', 'pendente')
            ->whereNotNull('scheduled_at')
            ->where('scheduled_at', '<=', now())
            ->limit(100)
            ->get();

        foreach ($due as $msg) {
            $this->sendNow($msg);
        }

        return $due->count();
    }
}
