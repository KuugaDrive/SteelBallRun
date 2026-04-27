<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PublicationAuthor extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'publication_authors';

    // Disable auto-incrementing since we use UUID
    public $incrementing = false;
    protected $keyType = 'string';

    const UPDATED_AT = null;

    protected $fillable = [
        'publication_id',
        'user_id',
        'nama_penulis',
        'urutan_penulis',
        'peran_penulis',
        'is_internal_brin',
    ];

    protected $casts = [
        'is_internal_brin' => 'boolean',
    ];

    public function publication(): BelongsTo
    {
        return $this->belongsTo(DocumentPublication::class, 'publication_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
