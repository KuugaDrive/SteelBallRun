<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Document extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'user_id',
        'document_type',
        'title',
        'kelompok_riset',
        'status',
        'notes',
        'monev_stamp',
        'monev_notes',
        'monev_status',
        'monev_stamp_locked',
        'is_locked_for_monev',
        'researcher_resubmitted_at',
        'revision_count',
    ];

    /**
     * The attributes that should be cast to native types.
     */
    protected $casts = [
        'monev_stamp' => 'datetime',
        'monev_stamp_locked' => 'datetime',
        'researcher_resubmitted_at' => 'datetime',
        'is_locked_for_monev' => 'boolean',
    ];

    /**
     * Relasi ke User yang membuat dokumen.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relasi one-to-one ke setiap tabel detail.
     */
    public function publication(): HasOne
    {
        return $this->hasOne(DocumentPublication::class);
    }

    public function intellectualProperty(): HasOne
    {
        return $this->hasOne(DocumentKekayaanIntelektual::class);
    }

    public function pks(): HasOne
    {
        return $this->hasOne(DocumentPks::class);
    }

    public function overseasTraining(): HasOne
    {
        return $this->hasOne(DocumentPelatihanLuarNegeri::class);
    }

    public function furtherStudy(): HasOne
    {
        return $this->hasOne(DocumentLoaStudiLanjut::class);
    }

    public function prototype(): HasOne
    {
        return $this->hasOne(DocumentPurwarupa::class);
    }
}