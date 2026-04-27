<?php

namespace App\Models;

// Pastikan ini ada
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use App\Notifications\CustomResetPasswordNotification; // Pastikan ini sudah di-import

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'unit_kerja_id',
        'name',
        'tingkat_fungsional',
        'jenis_fungsional',
        'email',
        'password',
        'role',
        'research_group',
        'google_scholar_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Kirim notifikasi reset password kustom.
     *
     * @param  string  $token
     * @return void
     */
    public function sendPasswordResetNotification($token)
    {
        $this->notify(new CustomResetPasswordNotification($token));
    }

    public function unitKerja()
    {
        return $this->belongsTo(MsUnitKerja::class, 'unit_kerja_id');
    }

    public function kelompokRiset()
    {
        return $this->belongsTo(MsKelompokRiset::class, 'research_group');
    }

    /**
     * Relasi ke Documents yang dibuat oleh user ini.
     */

    public function documents(): HasMany // Tambahkan method ini
    {
        return $this->hasMany(Document::class);
    }
}

