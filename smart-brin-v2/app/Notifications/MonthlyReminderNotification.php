<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class MonthlyReminderNotification extends Notification
{
    use Queueable;

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Pengingat Bulanan: Unggah Dokumen Penelitian Anda')
            ->greeting('Halo, ' . $notifiable->name)
            ->line('Ini adalah pengingat bahwa Anda diharapkan untuk mengunggah dokumen penelitian atau laporan lainnya bulan ini.')
            ->action('Upload Sekarang', url('/documents'))
            ->line('Terima kasih telah berkontribusi dalam sistem SMART-BRIN.');
    }
}
