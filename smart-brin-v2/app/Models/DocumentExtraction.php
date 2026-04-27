<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DocumentExtraction extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'id',
        'user_id',
        'raw_title',
        'raw_authors',
        'raw_author_list',
        'pub_type',
        'publication_year',
        'publisher',
        'doi',
        'issn',
        'quartile',
        'title',
        'scholar_link',
        'author_role',
        'author_order',
        'ai_abstract',
        'ai_core_focus',
        'ai_metadata',
        'status_mapping',
    ];

    protected $casts = [
        'raw_author_list' => 'array',
        'ai_metadata' => 'array',
        'publication_year' => 'integer',
        'author_order' => 'integer',
        'created_at' => 'datetime',
    ];
}
