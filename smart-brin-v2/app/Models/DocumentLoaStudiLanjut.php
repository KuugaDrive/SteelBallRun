<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentLoaStudiLanjut extends Model
{
    use HasFactory;

    /**
     * Nama tabel yang terhubung dengan model.
     */
    protected $table = 'document_loa_studi_lanjuts';

    /**
     * Atribut yang bisa diisi secara massal.
     */
    protected $fillable = [
        'document_id',
        'nama_sdm_iptek',
        'kelompok_riset', 
        'jenjang_pendidikan',
        'nama_universitas',
        'status',         
        'keterangan',
        'upload_dakung',
        'tahun_masuk',
        'status_upload',
    ];

    /**
     * Casting tipe data untuk atribut.
     */
    protected $casts = [
        'tahun_masuk' => 'integer',
    ];

    /**
     * Relasi ke model Document.
     */
    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }
}