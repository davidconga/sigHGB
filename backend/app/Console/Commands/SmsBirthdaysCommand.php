<?php

namespace App\Console\Commands;

use App\Models\Funcionario;
use App\Models\Setting;
use App\Services\Sms\SmsService;
use Illuminate\Console\Command;

class SmsBirthdaysCommand extends Command
{
    protected $signature = 'sms:birthdays {--dry-run : Apenas lista aniversariantes sem enviar}';
    protected $description = 'Envia SMS aos funcionários que fazem anos hoje';

    public function handle(SmsService $sms): int
    {
        $aniversariantes = Funcionario::aniversariantesHoje()->get();

        if ($aniversariantes->isEmpty()) {
            $this->info('Hoje não há aniversariantes. 🎂');
            return self::SUCCESS;
        }

        $template = Setting::get('sms_aniversario_template',
            'Parabéns {nome}! 🎂 O Hospital Geral de Benguela deseja-lhe um feliz aniversário e muitas felicidades neste seu dia especial.');

        $this->info("Encontrados {$aniversariantes->count()} aniversariantes:");

        $sent = 0; $failed = 0;
        foreach ($aniversariantes as $f) {
            $msg = $this->personaliza($template, $f);
            $this->line("  → {$f->nome} ({$f->telefone}): ".\Illuminate\Support\Str::limit($msg, 60));

            if ($this->option('dry-run')) continue;

            $r = $sms->dispatch(to: $f->telefone, body: $msg);
            if ($r->status === 'enviado') $sent++; else $failed++;
        }

        if (! $this->option('dry-run')) {
            $this->newLine();
            $this->info("Enviados: {$sent} · Falhados: {$failed}");
        }

        return self::SUCCESS;
    }

    private function personaliza(string $template, Funcionario $f): string
    {
        $primeiroNome = explode(' ', trim($f->nome))[0];
        $saudacao = match ($f->sexo) {
            'F' => 'Sra.',
            'M' => 'Sr.',
            default => '',
        };

        return strtr($template, [
            '{nome}' => $f->nome,
            '{primeiro_nome}' => $primeiroNome,
            '{saudacao}' => $saudacao,
            '{idade}' => $f->data_nascimento ? (string) $f->data_nascimento->age : '',
        ]);
    }
}
