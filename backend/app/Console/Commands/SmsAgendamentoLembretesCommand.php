<?php

namespace App\Console\Commands;

use App\Models\Agendamento;
use App\Services\Sms\SmsService;
use Illuminate\Console\Command;

class SmsAgendamentoLembretesCommand extends Command
{
    protected $signature = 'sms:agendamento-lembretes
        {--horas=24 : Janela de antecedência (h) a procurar marcações}
        {--dry-run : Não envia, apenas lista}';

    protected $description = 'Envia SMS de lembrete às marcações pendentes/confirmadas que ocorrem nas próximas N horas';

    public function handle(SmsService $sms): int
    {
        $horas = (int) $this->option('horas');
        $de    = now();
        $ate   = now()->addHours($horas);

        $marcacoes = Agendamento::with('paciente:id,nome,telefone')
            ->whereIn('status', ['pendente', 'confirmada'])
            ->where('sms_lembrete_enviado', false)
            ->whereBetween('data_agendamento', [$de, $ate])
            ->get();

        if ($marcacoes->isEmpty()) {
            $this->info('Sem marcações a lembrar.');
            return self::SUCCESS;
        }

        $this->info("Encontradas {$marcacoes->count()} marcações:");
        $enviados = 0;
        $sem_telefone = 0;

        foreach ($marcacoes as $a) {
            $paciente = $a->paciente;
            if (! $paciente?->telefone) {
                $sem_telefone++;
                $this->line("  ⚠️  {$a->numero} ({$paciente?->nome}): sem telefone");
                continue;
            }

            $quando = $a->data_agendamento->format('d/m/Y \à\s H:i');
            $body = "HGB: Lembrete — tem marcacao {$a->numero} em {$quando}. Compareca 15min antes. Para cancelar contacte-nos.";

            $this->line("  → {$paciente->nome} ({$paciente->telefone}): {$quando}");

            if ($this->option('dry-run')) continue;

            $sms->dispatch(
                to: $paciente->telefone,
                body: $body,
                pacienteId: $paciente->id,
            );

            $a->update(['sms_lembrete_enviado' => true]);
            $enviados++;
        }

        if (! $this->option('dry-run')) {
            $this->newLine();
            $this->info("Enviados: {$enviados} · Sem telefone: {$sem_telefone}");
        }

        return self::SUCCESS;
    }
}
