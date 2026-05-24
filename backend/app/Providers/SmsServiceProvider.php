<?php

namespace App\Providers;

use App\Services\Sms\LogSmsDriver;
use App\Services\Sms\SmsDriver;
use App\Services\Sms\SmsService;
use App\Services\Sms\TelcoSmsDriver;
use Illuminate\Support\ServiceProvider;

class SmsServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(SmsDriver::class, function () {
            $driver = env('SMS_DRIVER', 'log');

            return match ($driver) {
                'telcosms' => new TelcoSmsDriver(
                    url: env('TELCOSMS_URL', 'http://196.216.53.194:9501/api'),
                    username: env('TELCOSMS_USERNAME', ''),
                    key: env('TELCOSMS_KEY', ''),
                    sender: env('TELCOSMS_SENDER', 'HGB'),
                ),
                default => new LogSmsDriver(),
            };
        });

        $this->app->singleton(SmsService::class, fn ($app) => new SmsService($app->make(SmsDriver::class)));
    }
}
