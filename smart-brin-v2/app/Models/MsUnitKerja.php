<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class MsUnitKerja extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $table = 'ms_unit_kerja';

    protected $fillable = [
        'organisasi_riset_id',
        'kode_unit',
        'nama_unit',
        'kelompok_riset',
        'level',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function organisasiRiset()
    {
        return $this->belongsTo(MsOrganisasiRiset::class, 'organisasi_riset_id');
    }

    public function kelompokRisets()
    {
        return $this->hasMany(MsKelompokRiset::class, 'unit_kerja_id');
    }
}
