<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Notifications\MonthlyReminderNotification;

class SendMonthlyReminder extends Command
{
    protected $signature = 'reminder:monthly';
    protected $description = 'Kirim email pengingat bulanan ke semua user';

    public function handle(): void
    {
        $users = User::whereIn('role', ['researcher', 'head'])->get();
        foreach ($users as $user) {
            $user->notify(new MonthlyReminderNotification());
        }

        $this->info('Pengingat bulanan berhasil dikirim.');
    }
}
