<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentPelatihanLuarNegeri extends Model
{
    use HasFactory;

    /**
     * Nama tabel yang terhubung dengan model.
     */
    protected $table = 'document_pelatihan_luar_negeris';

    /**
     * Atribut yang bisa diisi secara massal.
     */
    protected $fillable = [
        'document_id',
        'nama_sdm_prsdi',
        'non_sdm_prsdi',
        'kelompok_riset', 
        'status',         
        'jenis',
        'keterangan',
        'upload_dakung',
        'status_upload',
    ];

    /**
     * Relasi ke model Document.
     */
    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }
}