<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentPurwarupa extends Model
{
    use HasFactory;

    /**
     * Nama tabel yang terhubung dengan model.
     */
    protected $table = 'document_purwarupas';

    /**
     * Atribut yang bisa diisi secara massal.
     */
    protected $fillable = [
        'document_id',
        'judul_purwarupa',
        'kelompok_riset', 
        'inventor1',
        'inventor2',
        'inventor3',
        'inventor4',
        'inventor5',
        'non_sivitas_prsdi',
        'jenis',
        'status',
        'nama_mitra',
        'link',
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