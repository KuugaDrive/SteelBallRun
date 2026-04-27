<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class MsOrganisasiRiset extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    public $timestamps = false;
    protected $keyType = 'string';

    protected $table = 'ms_organisasi_riset';

    protected $fillable = [
        'organisasi_riset',
    ];

    public function unitKerjas()
    {
        return $this->hasMany(MsUnitKerja::class, 'organisasi_riset_id');
    }
}
