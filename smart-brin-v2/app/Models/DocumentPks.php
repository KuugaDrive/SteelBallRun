<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentPks extends Model
{
    use HasFactory;

    /**
     * Nama tabel yang terhubung dengan model.
     */
    protected $table = 'document_pks';

    /**
     * Atribut yang bisa diisi secara massal.
     */
    protected $fillable = [
        'document_id',
        'judul',
        'kelompok_riset',
        'pic_prsdi1',
        'pic_prsdi2',
        'pic_prsdi3',
        'pic_nonprsdi',
        'tipe',
        'jenis',
        'sumber',
        'output',
        'pihak_k3',
        'nilai',
        'keterangan',
        'no_kerjasama',
        'tanggal_kerjasama',
        'no_perjanjian',
        'tanggal_perjanjian',
        'status_upload',
        'tahun_pks',
        'link_bukti_dukung',
    ];

    /**
     * Casting tipe data untuk atribut.
     */
    protected $casts = [
        'nilai' => 'double',
        'tanggal_kerjasama' => 'datetime',
        'tanggal_perjanjian' => 'datetime',
        'tahun_pks' => 'integer', 
    ];

    /**
     * Relasi ke model Document.
     */
    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }
}