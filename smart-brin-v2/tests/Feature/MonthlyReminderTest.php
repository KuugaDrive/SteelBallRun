<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Support\Facades\Mail;
use App\Mail\MonthlyReminderMail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;

class MonthlyReminderTest extends TestCase
{
    use RefreshDatabase;

    public function test_email_reminder_sent_to_test_user()
    {
        // Jalankan seeder untuk user
        $this->seed(\Database\Seeders\UsersTableSeeder::class);

        // Ambil user dari seeder
        $user = User::where('email', 'rsarakasa@BRIN.co.id')->first();

        // Pastikan user ditemukan
        $this->assertNotNull($user, 'User test.user@BRIN.co.id tidak ditemukan');

        Mail::fake();

        // Kirim email
        Mail::to($user->email)->send(new MonthlyReminderMail($user));

        // Cek apakah email terkirim
        Mail::assertSent(MonthlyReminderMail::class, function ($mail) use ($user) {
            return $mail->hasTo($user->email) && $mail->user->id === $user->id;
        });
    }
}
