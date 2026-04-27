<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DocumentPublication extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'document_publications';

    // Disable auto-incrementing since we use UUID
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'document_id',
        'judul_publikasi',
        'pub_type',
        'status_dokumen',
        'penerbit_jurnal',
        'tahun_publikasi',
        'url_resource',
        'doi',
        'issn',
        'quartile',
        'inti_penelitian',
        'abstrak',
    ];

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    public function authors(): HasMany
    {
        return $this->hasMany(PublicationAuthor::class, 'publication_id');
    }
}