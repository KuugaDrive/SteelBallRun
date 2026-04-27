<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentKekayaanIntelektual extends Model
{
    use HasFactory;

    /**
     * Nama tabel yang terhubung dengan model.
     */
    protected $table = 'document_kekayaan_intelektuals';

    /**
     * Atribut yang bisa diisi secara massal.
     */
    protected $fillable = [
        'document_id',
        'judul_ki',
        'kelompok_riset',
        'status',
        'inventors1',
        'inventors2',
        'inventors3',
        'inventors4',
        'inventors5',
        'inventors6',
        'inventors7',
        'inventors8',
        'nonprsdi_inventors',
        'jenis',
        'no_pendaftaran',
        'no_sertifikat',
        'tanggal_sertifikasi',
        'link_dokumen',
        'status_upload',
    ];

    /**
     * Casting tipe data untuk atribut.
     */
    protected $casts = [
        'tanggal_daftar' => 'datetime',
        'tanggal_sertifikasi' => 'datetime',
    ];

    /**
     * Relasi ke model Document.
     */
    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }
}