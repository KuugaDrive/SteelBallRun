<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Throwable;

use App\Models\Document;
use App\Models\DocumentPublication;
use App\Models\PublicationAuthor;
use App\Models\DocumentKekayaanIntelektual;
use App\Models\DocumentPks;
use App\Models\DocumentPurwarupa;
use App\Models\DocumentLoaStudiLanjut;
use App\Models\DocumentPelatihanLuarNegeri;


class DocumentStoreController extends Controller
{
    /**
     * Field labels untuk pesan error yang user-friendly
     */
    private const FIELD_LABELS = [
        // Publikasi Global
        'judul' => 'Judul Publikasi Global',
        'jenisDokumen/Jurnal/Prosiding/Bagbook' => 'Jenis Dokumen Publikasi',
        'statusDokumen' => 'Status Dokumen Publikasi',
        'namaJurnal/Prosiding/BagBook' => 'Nama Jurnal/Prosiding',
        'tahun_publikasi' => 'Tahun Publikasi',
        'status_upload' => 'Status Upload Dokumen',

        // Kekayaan Intelektual
        'judulciptaan' => 'Judul Inovasi/Karya',
        'Status' => 'Status',
        'PenciptaDariPusatRisetSainsDataDanInformasi' => 'Inventor',
        'JenisDokumen' => 'Jenis Kekayaan Intelektual',
        'nomorPermohonan' => 'Nomor Pendaftaran',
        'tanggalPenerimaan' => 'Tanggal Sertifikasi',

        // Studi Lanjut
        'namaMahasiswaAtauPeserta' => 'Nama SDM Studi Lanjut',
        'programPendidikan' => 'Jenjang Pendidikan Ditempuh',
        'namaUniversitasPenerima' => 'Nama Universitas',
        'tahunMasuk' => 'Tahun Masuk',
        'status' => 'Status',

        // PKS
        'tipe' => 'Tipe',
        'jenis' => 'Jenis',
        'sumber' => 'Sumber',
        'output' => 'Output',
        'tglKerjasama' => 'Tanggal Kerjasama',
        'linkUpload' => 'Link Upload',

        // Purwarupa
        'jenisPurwarupa' => 'Jenis Purwarupa',
        'namaMitra' => 'Nama Mitra',

        // PDVR
        'namaSdmPRSDI' => 'Nama SDM PRSDI',
        'namaSdmNonPRSDI' => 'Nama SDM Non PRSDI',
        'lokasiKegiatan' => 'Lokasi Kegiatan',
        'keterangan' => 'Keterangan',
    ];

    /**
     * Required fields per document type
     */
    private const REQUIRED_FIELDS = [
        'publikasi-global' => [
            'judul',
            'jenisDokumen/Jurnal/Prosiding/Bagbook',
            'statusDokumen',
            'namaJurnal/Prosiding/BagBook',
            'tahun_publikasi'
        ],
        'kekayaan-intelektual' => [
            'judulciptaan',
            'Status',
            'PenciptaDariPusatRisetSainsDataDanInformasi',
            'JenisDokumen',
            'nomorPermohonan',
            'tanggalPenerimaan',
            'status_upload'
        ],
        'studi-lanjut' => [
            'namaMahasiswaAtauPeserta',
            'programPendidikan',
            'namaUniversitasPenerima',
            'tahunMasuk',
            'status',
            'status_upload'
        ],
        'perjanjian-kerjasama' => [
            'judul',
            'tipe',
            'jenis',
            'sumber',
            'output',
            'tglKerjasama',
            'linkUpload',
            'status_upload'
        ],
        'purwarupa' => [
            'judulciptaan',
            'PenciptaDariPusatRisetSainsDataDanInformasi',
            'jenisPurwarupa',
            'namaMitra',
            'status',
            'status_upload'
        ],
        'pdvr' => [
            'status',
            'lokasiKegiatan',
            'keterangan',
            'status_upload'
        ],
    ];


    /**
     * Validasi metadata berdasarkan tipe dokumen
     */
    private function validateMetadata(string $documentKey, array $metadata): array
    {
        if (!isset(self::REQUIRED_FIELDS[$documentKey])) {
            return [
                'valid' => false,
                'message' => 'Tipe dokumen tidak valid.',
            ];
        }

        $requiredFields = self::REQUIRED_FIELDS[$documentKey];
        $missingFields = [];

        foreach ($requiredFields as $field) {
            $value = $metadata[$field] ?? null;

            // Handle different data types safely
            if ($this->isFieldEmpty($value)) {
                $missingFields[] = self::FIELD_LABELS[$field] ?? $field;
            }
        }

        if (!empty($missingFields)) {
            return [
                'valid' => false,
                'message' => 'Field berikut wajib diisi: ' . implode(', ', $missingFields),
                'missing_fields' => $missingFields,
            ];
        }

        return ['valid' => true];
    }

    /**
     * Check if field is empty safely handling different data types
     */
    private function isFieldEmpty($value): bool
    {
        // Handle null
        if (is_null($value)) {
            return true;
        }

        // Handle array
        if (is_array($value)) {
            return empty($value);
        }

        // Handle string
        if (is_string($value)) {
            return trim($value) === '';
        }

        // Handle other types (convert to string first)
        return trim((string) $value) === '';
    }

    /**
     * Menyimpan data dokumen yang sudah direview ke database.
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        // Gunakan $request->user() untuk cek autentikasi
        if (!$request->user()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: Sesi tidak valid atau token tidak ditemukan.',
            ], 401);
        }

        $validator = Validator::make($request->all(), [
            'documentKey' => 'required|string',
            'metadata' => 'required|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $documentKey = $request->input('documentKey');
        $metadata = $request->input('metadata');

        // Validasi metadata berdasarkan tipe dokumen
        $metadataValidationResult = $this->validateMetadata($documentKey, $metadata);
        if (!$metadataValidationResult['valid']) {
            return response()->json([
                'success' => false,
                'message' => $metadataValidationResult['message'],
                'missing_fields' => $metadataValidationResult['missing_fields'] ?? null,
            ], 422);
        }

        // ── Early duplicate check for publikasi-global (before transaction) ──
        if ($documentKey === 'publikasi-global') {
            $judulCheck = trim((string) ($metadata['judul'] ?? ''));
            if ($judulCheck !== '') {
                $existingPub = DocumentPublication::whereRaw('LOWER(judul_publikasi) = LOWER(?)', [$judulCheck])->first();
                if ($existingPub) {
                    $user = $request->user();
                    $alreadyAuthor = PublicationAuthor::where('publication_id', $existingPub->id)
                        ->where('user_id', $user->id)->exists();

                    if ($alreadyAuthor) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Anda sudah pernah mengupload publikasi dengan judul yang sama.',
                        ], 409);
                    }
                    return response()->json([
                        'success' => false,
                        'message' => 'Publikasi dengan judul ini sudah pernah diupload oleh anggota lain. Silakan hubungi pengelola jika Anda adalah co-author.',
                    ], 409);
                }
            }
        }

        DB::beginTransaction();


        try {
            $user = $request->user();
            $researchGroupName = $this->resolveResearchGroupName($user);

            $document = Document::create([
                'user_id' => $user->id,
                'document_type' => $documentKey,
                'title' => $metadata['judul'] ?? $metadata['judulciptaan'] ?? $metadata['title'] ?? 'Judul Tidak Ditemukan',
                'kelompok_riset' => $researchGroupName,
                'status' => 'submitted',
            ]);

            switch ($documentKey) {
                // ==========================================================
                // === PUBLIKASI GLOBAL ===
                // ==========================================================
                case 'publikasi-global':
                    try {
                        // ── Parse tahun_publikasi ─────────────────────────
                        $tahunPublikasi = isset($metadata['tahun_publikasi']) && is_numeric($metadata['tahun_publikasi'])
                            ? (int) $metadata['tahun_publikasi']
                            : (int) date('Y');

                        $pub = DocumentPublication::create([
                            'document_id'     => $document->id,
                            'judul_publikasi' => $metadata['judul'] ?? 'Untitled',
                            'pub_type'        => $metadata['jenisDokumen/Jurnal/Prosiding/Bagbook'] ?? 'Unknown',
                            'status_dokumen'  => $metadata['statusDokumen'] ?? null,
                            'penerbit_jurnal' => $metadata['namaJurnal/Prosiding/BagBook'] ?? null,
                            'tahun_publikasi' => $tahunPublikasi,
                            'url_resource'    => $metadata['linkDOI'] ?? null,
                            'doi'             => $metadata['linkDOI'] ?? null,
                            'issn'            => $metadata['issn'] ?? null,
                            'quartile'        => $metadata['quartile'] ?? null,
                            'inti_penelitian' => $metadata['inti_penelitian'] ?? null,
                            'abstrak'         => $metadata['abstrak'] ?? null,
                        ]);

                        // ── Structured authors array from frontend ─────────
                        // Each entry: { nama: string, peran: string, is_internal_brin: bool, user_id?: string }
                        $authorsPayload = $request->input('metadata.authors', []);
                        if (!is_array($authorsPayload) || empty($authorsPayload)) {
                            // Fallback: try top-level authors key
                            $authorsPayload = $request->input('authors', []);
                        }

                        if (is_array($authorsPayload) && !empty($authorsPayload)) {
                            foreach ($authorsPayload as $idx => $authorEntry) {
                                $namaRaw      = trim((string) ($authorEntry['nama'] ?? ''));
                                $peran        = trim((string) ($authorEntry['peran'] ?? 'Co-Author'));
                                $isInternal   = (bool) ($authorEntry['is_internal_brin'] ?? false);
                                $userIdFromFE = $authorEntry['user_id'] ?? null;

                                if ($namaRaw === '') continue;

                                // Try to resolve user_id: prefer frontend-supplied, then DB fuzzy match
                                $resolvedUserId = null;
                                if ($userIdFromFE) {
                                    $resolvedUserId = $userIdFromFE;
                                } elseif ($isInternal) {
                                    // Hanya gunakan exact match agar tidak salah tag (misal Diana ter-tag ke Ana Hadiana)
                                    $matched = \App\Models\User::whereRaw('LOWER(name) = ?', [strtolower($namaRaw)])->first();
                                    $resolvedUserId = $matched?->id;
                                }

                                \App\Models\PublicationAuthor::create([
                                    'publication_id'  => $pub->id,
                                    'user_id'         => $resolvedUserId,
                                    'nama_penulis'    => $namaRaw,
                                    'urutan_penulis'  => $idx + 1,
                                    'peran_penulis'   => $peran,
                                    'is_internal_brin' => $isInternal,
                                ]);
                            }
                        }
                    } catch (Throwable $e) {
                        DB::rollBack();
                        Log::error("Error saat menyimpan publikasi global: " . $e->getMessage());
                        return response()->json([
                            'success' => false,
                            'message' => 'Gagal menyimpan data Publikasi Global. Periksa kembali data yang diinput.',
                            'error_details' => $e->getMessage(),
                        ], 500);
                    }
                    break;


                // ==========================================================
                // === KEKAYAAN INTELEKTUAL ===
                // ==========================================================
                case 'kekayaan-intelektual':
                    try {
                        $prsdiInventorsString = $metadata['PenciptaDariPusatRisetSainsDataDanInformasi'];

                        if (is_string($prsdiInventorsString)) {
                            if (preg_match('/\b[A-Z]\.[A-Z][a-z]*\.?\b/', $prsdiInventorsString)) {
                                $prsdiInventorsArray = preg_split('/,(?=[A-Z])/', $prsdiInventorsString);
                            } else {
                                $prsdiInventorsArray = explode(',', $prsdiInventorsString);
                            }
                            $prsdiInventorsArray = array_map('trim', $prsdiInventorsArray);
                        } else {
                            $prsdiInventorsArray = is_array($prsdiInventorsString) ? $prsdiInventorsString : [];
                        }

                        $inventorData = [];
                        foreach (array_slice($prsdiInventorsArray, 0, 8) as $index => $inventorName) {
                            $inventorData['inventors' . ($index + 1)] = trim($inventorName);
                        }

                        $nonPrsdiInventorsArray = $metadata['PenciptaNonPusatRisetSainsDataDanInformasi'] ?? [];
                        $nonPrsdiInventorsString = is_array($nonPrsdiInventorsArray) ? implode(', ', $nonPrsdiInventorsArray) : $nonPrsdiInventorsArray;

                        $kiBaseData = [
                            'document_id' => $document->id,
                            'judul_ki' => $metadata['judulciptaan'],
                            'kelompok_riset' => $researchGroupName,
                            'status' => $metadata['Status'],
                            'nonprsdi_inventors' => $nonPrsdiInventorsString,
                            'jenis' => $metadata['JenisDokumen'],
                            'no_pendaftaran' => $metadata['nomorPermohonan'],
                            'no_sertifikat' => $metadata['nomorPencatatan'] ?? null,
                            'tanggal_sertifikasi' => $metadata['tanggalPenerimaan'],
                            'link_dokumen' => $metadata['linkDokumen'] ?? null,
                            'status_upload' => $metadata['status_upload'],
                        ];

                        $finalKiData = array_merge($kiBaseData, $inventorData);
                        DocumentKekayaanIntelektual::create($finalKiData);
                    } catch (Throwable $e) {
                        DB::rollBack();
                        Log::error("Error saat menyimpan kekayaan intelektual: " . $e->getMessage());
                        return response()->json([
                            'success' => false,
                            'message' => 'Gagal menyimpan data Kekayaan Intelektual. Periksa format tanggal dan data lainnya.',
                            'error_details' => $e->getMessage(),
                        ], 500);
                    }
                    break;

                // ==========================================================
                // === STUDI LANJUT ===
                // ==========================================================    
                case 'studi-lanjut':
                    try {
                        DocumentLoaStudiLanjut::create([
                            'document_id' => $document->id,
                            'nama_sdm_iptek' => $metadata['namaMahasiswaAtauPeserta'],
                            'kelompok_riset' => $researchGroupName,
                            'jenjang_pendidikan' => $metadata['programPendidikan'],
                            'nama_universitas' => $metadata['namaUniversitasPenerima'],
                            'tahun_masuk' => $metadata['tahunMasuk'],
                            'status' => $metadata['status'],
                            'keterangan' => $metadata['keterangan'] ?? null,
                            'upload_dakung' => $metadata['linkDataPendukung'] ?? null,
                            'status_upload' => $metadata['status_upload'],
                        ]);
                    } catch (Throwable $e) {
                        DB::rollBack();
                        Log::error("Error saat menyimpan studi lanjut: " . $e->getMessage());
                        return response()->json([
                            'success' => false,
                            'message' => 'Gagal menyimpan data Studi Lanjut. Periksa format tahun masuk dan data lainnya.',
                            'error_details' => $e->getMessage(),
                        ], 500);
                    }
                    break;

                // ==========================================================
                // === PERJANJIAN KERJASAMA DAN DANA EKSTERNAL ===
                // ==========================================================
                case 'perjanjian-kerjasama':
                    try {
                        $picString = $metadata['PICKegiatanSivitasPRSDI'] ?? '';

                        if (is_string($picString) && !empty($picString)) {
                            if (preg_match('/\b[A-Z]\.[A-Z][a-z]*\.?\b/', $picString)) {
                                $picArray = preg_split('/,(?=[A-Z])/', $picString);
                            } else {
                                $picArray = explode(',', $picString);
                            }
                            $picArray = array_filter(array_map('trim', $picArray));
                        } else {
                            $picArray = [];
                        }

                        $picData = [];
                        foreach (array_slice($picArray, 0, 3) as $index => $picName) {
                            $picData['pic_prsdi' . ($index + 1)] = trim($picName);
                        }

                        $pksBaseData = [
                            'document_id' => $document->id,
                            'judul' => $metadata['judul'],
                            'kelompok_riset' => $researchGroupName,
                            'pic_nonprsdi' => $metadata['PICKegiatanNonSivitasPRSDI'] ?? null,
                            'tipe' => $metadata['tipe'],
                            'jenis' => $metadata['jenis'],
                            'sumber' => $metadata['sumber'] ?? null,
                            'output' => $metadata['output'] ?? null,
                            'pihak_k3' => $metadata['pihakK3'] ?? null,
                            'nilai' => $metadata['nilai'] ?? null,
                            'keterangan' => $metadata['keterangan'] ?? null,
                            'no_kerjasama' => $metadata['noKerjasama'] ?? null,
                            'tanggal_kerjasama' => $metadata['tglKerjasama'] ?? null,
                            'no_perjanjian' => $metadata['noPerjanjian'] ?? null,
                            'tanggal_perjanjian' => $metadata['tglPerjanjian'] ?? null,
                            'link_upload' => $metadata['linkUpload'] ?? null,
                            'status_upload' => $metadata['status_upload'],
                            'tahun_pks' => $metadata['tahunPKS'] ?? null,
                            'link_bukti_dukung' => $metadata['linkDataPendukung'] ?? null,
                        ];

                        $finalPksData = array_merge($pksBaseData, $picData);
                        DocumentPks::create($finalPksData);
                    } catch (Throwable $e) {
                        DB::rollBack();
                        Log::error("Error saat menyimpan PKS: " . $e->getMessage());
                        return response()->json([
                            'success' => false,
                            'message' => 'Gagal menyimpan data Perjanjian Kerjasama. Periksa format tanggal dan link yang diinput.',
                            'error_details' => $e->getMessage(),
                        ], 500);
                    }
                    break;

                // ==========================================================
                // ===                      PURWARUPA                     ===
                // ==========================================================
                case 'purwarupa':
                    try {
                        $prsdiInventorsString = $metadata['PenciptaDariPusatRisetSainsDataDanInformasi'];

                        if (is_string($prsdiInventorsString) && !empty($prsdiInventorsString)) {
                            if (preg_match('/\b[A-Z]\.[A-Z][a-z]*\.?\b/', $prsdiInventorsString)) {
                                $prsdiInventorsArray = preg_split('/,(?=[A-Z])/', $prsdiInventorsString);
                            } else {
                                $prsdiInventorsArray = explode(',', $prsdiInventorsString);
                            }
                            $prsdiInventorsArray = array_map('trim', $prsdiInventorsArray);
                        } else {
                            $prsdiInventorsArray = is_array($prsdiInventorsString) ? $prsdiInventorsString : [];
                        }

                        $inventorData = [];
                        foreach (array_slice($prsdiInventorsArray, 0, 5) as $index => $inventorName) {
                            $inventorData['inventor' . ($index + 1)] = trim($inventorName);
                        }

                        $nonPrsdiInventorsArray = $metadata['PenciptaNonPusatRisetSainsDataDanInformasi'] ?? [];
                        $nonPrsdiInventorsString = is_array($nonPrsdiInventorsArray) ? implode(', ', $nonPrsdiInventorsArray) : $nonPrsdiInventorsArray;
                        $purwarupaBaseData = [
                            'document_id' => $document->id,
                            'judul_purwarupa' => $metadata['judulciptaan'],
                            'kelompok_riset' => $researchGroupName,
                            'non_sivitas_prsdi' => $nonPrsdiInventorsString,
                            'jenis' => $metadata['jenisPurwarupa'],
                            'status' => $metadata['status'],
                            'nama_mitra' => $metadata['namaMitra'] ?? null,
                            'link' => $metadata['linkDataPendukung'] ?? null,
                            'status_upload' => $metadata['status_upload'],
                        ];

                        $finalPurwarupaData = array_merge($purwarupaBaseData, $inventorData);
                        DocumentPurwarupa::create($finalPurwarupaData);
                    } catch (Throwable $e) {
                        DB::rollBack();
                        Log::error("Error saat menyimpan purwarupa: " . $e->getMessage());
                        return response()->json([
                            'success' => false,
                            'message' => 'Gagal menyimpan data Purwarupa. Periksa kembali data inventor dan nama mitra.',
                            'error_details' => $e->getMessage(),
                        ], 500);
                    }
                    break;

                // ==========================================================
                // === PDVR / PELATIHAN LUAR NEGERI ===
                // ==========================================================
                case 'pdvr':
                    try {
                        DocumentPelatihanLuarNegeri::create([
                            'document_id' => $document->id,
                            'nama_sdm_prsdi' => $metadata['namaSdmPRSDI'] ?? null,
                            'non_sdm_prsdi' => $metadata['namaSdmNonPRSDI'] ?? null,
                            'kelompok_riset' => $researchGroupName,
                            'status' => $metadata['status'],
                            'jenis' => $metadata['lokasiKegiatan'],
                            'keterangan' => $metadata['keterangan'],
                            'upload_dakung' => $metadata['linkDataPendukung'] ?? null,
                            'status_upload' => $metadata['status_upload'],
                        ]);
                    } catch (Throwable $e) {
                        DB::rollBack();
                        Log::error("Error saat menyimpan PDVR: " . $e->getMessage());
                        return response()->json([
                            'success' => false,
                            'message' => 'Gagal menyimpan data PDVR. Periksa kembali data SDM dan keterangan.',
                            'error_details' => $e->getMessage(),
                        ], 500);
                    }
                    break;

                default:
                    DB::rollBack();
                    return response()->json(['success' => false, 'message' => 'Tipe dokumen tidak valid.'], 400);
            }

            DB::commit();

            Log::info("Dokumen berhasil disimpan dengan ID: {$document->id} oleh: {$user->name} dan tipe: {$documentKey}");

            return response()->json([
                'success' => true,
                'message' => 'Dokumen berhasil disimpan ke database!',
                'document_id' => $document->id,
                'user_name' => $user->name,
            ], 201);

        } catch (Throwable $e) {
            DB::rollBack();

            // Tentukan jenis error berdasarkan pesan error
            $errorMessage = 'Terjadi kesalahan saat menyimpan dokumen.';

            if (str_contains($e->getMessage(), 'foreign key constraint')) {
                $errorMessage = 'Gagal menyimpan: Terdapat masalah dengan relasi data. Pastikan semua data valid.';
            } elseif (str_contains($e->getMessage(), 'Data too long')) {
                $errorMessage = 'Gagal menyimpan: Data yang diinput terlalu panjang. Periksa kembali input Anda.';
            } elseif (str_contains($e->getMessage(), 'Duplicate entry')) {
                $errorMessage = 'Gagal menyimpan: Data sudah ada sebelumnya. Periksa nomor pendaftaran atau identitas unik lainnya.';
            } elseif (str_contains($e->getMessage(), 'cannot be null')) {
                $errorMessage = 'Gagal menyimpan: Ada field wajib yang belum diisi. Periksa kembali semua field yang diperlukan.';
            } elseif (str_contains($e->getMessage(), 'Invalid datetime format')) {
                $errorMessage = 'Gagal menyimpan: Format tanggal tidak valid. Pastikan format tanggal sudah benar (YYYY-MM-DD).';
            }

            Log::error("Gagal menyimpan dokumen {$documentKey}: " . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => $errorMessage,
                'document_type' => $documentKey,
                'error_details' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    private function resolveResearchGroupName($user): string
    {
        if (!$user?->research_group) {
            return 'Tidak Ada';
        }

        $groupName = DB::table('ms_kelompok_riset')
            ->where('id', $user->research_group)
            ->value('kelompok_riset');

        return is_string($groupName) && trim($groupName) !== '' ? $groupName : 'Tidak Ada';
    }
}
