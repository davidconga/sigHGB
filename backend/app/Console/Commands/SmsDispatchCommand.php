<?php

namespace App\Console\Commands;

use App\Services\Sms\SmsService;
use Illuminate\Console\Command;

class SmsDispatchCommand extends Command
{
    protected $signature = 'sms:dispatch';
    protected $description = 'Envia SMS pendentes/agendadas cujo horário já chegou';

    public function handle(SmsService $sms): int
    {
        $count = $sms->dispatchDuePending();
        $this->info("Processadas {$count} SMS pendentes.");
        return self::SUCCESS;
    }
}
