<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class MsKelompokRiset extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    public $timestamps = false;
    protected $keyType = 'string';

    protected $table = 'ms_kelompok_riset';

    protected $fillable = [
        'unit_kerja_id',
        'kelompok_riset',
    ];

    public function unitKerja()
    {
        return $this->belongsTo(MsUnitKerja::class, 'unit_kerja_id');
    }
}
