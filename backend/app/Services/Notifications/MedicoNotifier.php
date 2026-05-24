<?php

namespace App\Services\Notifications;

use App\Models\Medico;
use App\Models\Setting;
use App\Models\User;
use App\Services\Sms\SmsService;

/**
 * Distribuidor de notificações para médicos.
 *
 * Hoje suporta apenas canal SMS. No futuro, basta adicionar novos canais
 * (ex.: push para app Android "pipper") implementando uma interface
 * NotificationChannel e registando-os no método send().
 */
class MedicoNotifier
{
    public function __construct(
        private SmsService $sms,
        private PushChannel $push,
    ) {}

    /**
     * Notifica o médico sobre a atribuição de um documento.
     *
     * @param  string  $tipo  'atestado' | 'relatorio'
     * @param  array  $vars  ['numero' => 'AT-...', 'paciente' => 'Nome', 'tipo_doc' => '...', ...]
     */
    public function notifyAssignment(Medico $medico, string $tipo, array $vars): void
    {
        if (! Setting::get("notify_medico_{$tipo}_enabled", '1')) {
            return;
        }

        if (! $medico->telefone) return;

        $message = $this->renderTemplate(
            Setting::get("notify_medico_{$tipo}_template", $this->defaultTemplate($tipo)),
            array_merge($vars, [
                'medico' => $medico->nome,
                'primeiro_nome_medico' => explode(' ', trim($medico->nome))[1] ?? $medico->nome,
            ])
        );

        // Canal SMS
        $this->sms->dispatch(
            to: $medico->telefone,
            body: $message,
        );

        // Canal Push (pipper Android) — para todos os utilizadores associados ao médico
        if (Setting::get("notify_medico_{$tipo}_push_enabled", '1')) {
            User::where('medico_id', $medico->id)->each(function ($user) use ($tipo, $vars, $message) {
                $this->push->sendToUser(
                    userId: $user->id,
                    title: $tipo === 'atestado' ? 'Novo atestado atribuído' : 'Novo relatório atribuído',
                    body: $message,
                    data: ['tipo' => $tipo, 'numero' => $vars['numero'] ?? null],
                );
            });
        }
    }

    private function renderTemplate(string $tpl, array $vars): string
    {
        $replacements = [];
        foreach ($vars as $k => $v) {
            $replacements['{'.$k.'}'] = (string) $v;
        }
        return strtr($tpl, $replacements);
    }

    private function defaultTemplate(string $tipo): string
    {
        return match ($tipo) {
            'atestado' => 'HGB: Foi-lhe atribuido o atestado {numero} do paciente {paciente}. Aceda ao sistema para emitir.',
            'relatorio' => 'HGB: Foi-lhe atribuido o relatorio {numero} ({tipo_doc}) do paciente {paciente}.',
            default => 'HGB: Novo documento {numero} atribuido a si.',
        };
    }
}
