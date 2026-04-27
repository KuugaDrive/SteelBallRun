<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use App\Models\DocumentExtraction;

class MasterDataController extends Controller
{
    /**
     * Get list of Publikasi Types
     */
    public function getPublikasiTypes(): JsonResponse
    {
        // Ambil jenis publikasi yang ada di tabel hasil ekstraksi
        $types = DocumentExtraction::select('pub_type')
            ->whereNotNull('pub_type')
            ->where('pub_type', '!=', '')
            ->distinct()
            ->pluck('pub_type')
            ->map(function ($type) {
                return [
                    'value' => $type,
                    'label' => $type
                ];
            })
            ->toArray();

        // Fallback default jika tabel masih kosong
        if (empty($types)) {
            $types = [
                ['value' => 'Journal Article', 'label' => 'Journal Article'],
                ['value' => 'Conference Paper', 'label' => 'Conference Paper'],
                ['value' => 'Book Chapter', 'label' => 'Book Chapter'],
            ];
        }

        return response()->json($types);
    }
}
