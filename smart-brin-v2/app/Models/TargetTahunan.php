<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TargetTahunan extends Model
{
    protected $table = 'target_tahunans';

    protected $fillable = [
        'tahun',
        'kekayaan_intelektual',
        'publikasi_ilmiah_global',
        'purwarupa',
        'kerjasama_internasional',
        'kerjasama_nasional',
        'dana_eksternal',
        'sdm_studi_lanjut',
        'postdoc_visiting',
        'pelatihan_internasional',
    ];

    protected $casts = [
        'tahun'               => 'integer',
        'kekayaan_intelektual'=> 'integer',
        'publikasi_ilmiah_global' => 'integer',
        'purwarupa'           => 'integer',
        'kerjasama_internasional' => 'integer',
        'kerjasama_nasional'  => 'integer',
        'dana_eksternal'      => 'integer',
        'sdm_studi_lanjut'    => 'integer',
        'postdoc_visiting'    => 'integer',
        'pelatihan_internasional' => 'integer',
    ];
}
