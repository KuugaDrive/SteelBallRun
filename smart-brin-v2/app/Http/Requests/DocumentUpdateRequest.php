<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Log;

class DocumentUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // We'll check authorization in the controller
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        // Get the document type from the route
        $type = $this->route('type');

        // Common validation rules for all document types
        $rules = [
            'judul' => 'sometimes|string|max:255',
            'kelompokRiset' => 'sometimes|string|max:255',
            'status_monev' => 'sometimes|string|in:approved,rejected,submitted,revised,-',
            'notes' => 'sometimes|string|nullable',
            // Monev feedback fields
            'monev_notes' => 'sometimes|string|nullable',
            'monev_status' => 'sometimes|string|in:approved,rejected,needs_revision',
        ];

        // Type-specific validation rules
        switch ($type) {
            case 'publication':
                $rules = array_merge($rules, [
                    'authorsCivitasPRSDI' => 'sometimes|string|max:255',
                    'authorsCivitasPRSDI2' => 'sometimes|string|nullable|max:255',
                    'authorsCivitasPRSDI3' => 'sometimes|string|nullable|max:255',
                    'authorsCivitasPRSDI4' => 'sometimes|string|nullable|max:255',
                    'authorsCivitasPRSDI5' => 'sometimes|string|nullable|max:255',
                    'authorsCivitasPRSDI6' => 'sometimes|string|nullable|max:255',
                    'authorsCivitasPRSDI7' => 'sometimes|string|nullable|max:255',
                    'authorsNonCivitasPRSDI' => 'sometimes|string|nullable',
                    'jenisDokumen/Jurnal/Prosiding/Bagbook' => 'sometimes|string',
                    'statusDokumen' => 'sometimes|string',
                    'namaJurnal/Prosiding/BagBook' => 'sometimes|string|max:255',
                    'terindeksScopus' => 'sometimes|in:Ya,Tidak',
                    'reputasiScopus' => 'sometimes|string|nullable',
                    'linkDokumen' => 'sometimes|nullable|string|max:255',
                    'linkDOI' => 'sometimes|nullable|string|max:255',
                    'url' => 'sometimes|nullable|string|max:255',
                    'status_upload' => 'sometimes|string',
                ]);
                break;
            case 'ki':
                $rules = array_merge($rules, [
                    'inventor1' => 'sometimes|string|max:255',
                    'inventor2' => 'sometimes|string|nullable|max:255',
                    'inventor3' => 'sometimes|string|nullable|max:255',
                    'inventor4' => 'sometimes|string|nullable|max:255',
                    'inventor5' => 'sometimes|string|nullable|max:255',
                    'inventor6' => 'sometimes|string|nullable|max:255',
                    'inventor7' => 'sometimes|string|nullable|max:255',
                    'inventor8' => 'sometimes|string|nullable|max:255',
                    'nonSivitasPRSDI' => 'sometimes|string|nullable',
                    'status' => 'sometimes|string',
                    'jenis' => 'sometimes|string',
                    'noPendaftaran' => 'sometimes|string|nullable',
                    'noSertifikat' => 'sometimes|string|nullable',
                    'tanggalSertifikasi' => 'sometimes|date|nullable',
                    'linkDokumen' => 'sometimes|string|nullable',
                    'status_upload' => 'sometimes|string',
                ]);
                break;
            case 'pks':
                $rules = array_merge($rules, [
                    'pic1' => 'sometimes|string|nullable',
                    'pic2' => 'sometimes|string|nullable',
                    'pic3' => 'sometimes|string|nullable',
                    'picNonPRSDI' => 'sometimes|string|nullable',
                    'tipe' => 'sometimes|string',
                    'jenis' => 'sometimes|string',
                    'sumber' => 'sometimes|string|nullable',
                    'output' => 'sometimes|string|nullable',
                    'pihakK3' => 'sometimes|string|nullable',
                    'nilai' => 'sometimes|string|nullable',
                    'keterangan' => 'sometimes|string|nullable',
                    'noKerjasama' => 'sometimes|string|nullable',
                    'tanggalKerjasama' => 'sometimes|date|nullable',
                    'noPerjanjian' => 'sometimes|string|nullable',
                    'tanggalPerjanjian' => 'sometimes|date|nullable',
                    'status_upload' => 'sometimes|string',
                    'tahunPKS' => 'sometimes|string|nullable',
                    'linkBuktiDukung' => 'sometimes|string|nullable',
                    'catatan' => 'sometimes|string|nullable',
                ]);
                break;
            case 'loa':
                $rules = array_merge($rules, [
                    'namaSDMIptek' => 'sometimes|string|nullable',
                    'jenjangPendidikan' => 'sometimes|string|nullable',
                    'namaUniversitas' => 'sometimes|string|nullable',
                    'status' => 'sometimes|string',
                    'status_upload' => 'sometimes|string',
                    'keterangan' => 'sometimes|string|nullable',
                    'uploadDakung' => 'sometimes|string|nullable',
                    'tahunMasuk' => 'sometimes|string|nullable',
                ]);
                break;
            case 'pdvr':
                $rules = array_merge($rules, [
                    'namaSDMPRSDI' => 'sometimes|string|nullable',
                    'nonSDMPRSDI' => 'sometimes|string|nullable',
                    'kelompokRiset' => 'sometimes|string|nullable',
                    'status' => 'sometimes|string',
                    'jenis' => 'sometimes|string',
                    'keterangan' => 'sometimes|string|nullable',
                    'uploadDakung' => 'sometimes|string|nullable',
                    'status_upload' => 'sometimes|string',
                ]);
                break;
            case 'purwarupa':
                $rules = array_merge($rules, [
                    'judulPurwarupa' => 'sometimes|string|nullable',
                    'kelompokRiset' => 'sometimes|string|nullable',
                    'inventor1' => 'sometimes|string|nullable',
                    'inventor2' => 'sometimes|string|nullable',
                    'inventor3' => 'sometimes|string|nullable',
                    'inventor4' => 'sometimes|string|nullable',
                    'inventor5' => 'sometimes|string|nullable',
                    'nonSivitasPRSDI' => 'sometimes|string|nullable',
                    'jenis' => 'sometimes|string',
                    'status' => 'sometimes|string',
                    'status_upload' => 'sometimes|string',
                    'namaMitra' => 'sometimes|string|nullable',
                    'link' => 'sometimes|string|nullable',
                ]);
                break;
        }

        return $rules;
    }

    /**
     * Prepare the data for validation.
     *
     * @return void
     */
    protected function prepareForValidation()
    {
        // Get the request data
        $data = $this->all();
        $cleaned = [];

        // Clean input data
        foreach ($data as $key => $value) {
            // Trim string values and convert empty strings to null
            if (is_string($value)) {
                $value = trim($value);
                $value = $value === '' ? null : $value;
            }

            // Strip dangerous content if needed
            if (is_string($value)) {
                // Basic sanitization - you might want to use a more robust solution
                $value = strip_tags($value);
            }

            $cleaned[$key] = $value;
        }

        // Replace the request data with the cleaned data
        $this->replace($cleaned);

        \Log::debug("Request data prepared for validation", [
            'original' => $data,
            'cleaned' => $cleaned,
            'type' => $this->route('type'),
            'id' => $this->route('id')
        ]);
    }

    /**
     * Get the mapped data for updating the document.
     *
     * @return array
     */
    public function getMappedDocumentData()
    {
        $type = $this->route('type');
        $data = $this->validated();

        $documentData = [];

        // Common field mappings across document types
        if (isset($data['judul'])) {
            $documentData['title'] = $data['judul'];
        }

        if (isset($data['kelompokRiset'])) {
            $documentData['kelompok_riset'] = $data['kelompokRiset'];
        }

        // Map monev feedback fields
        if (isset($data['monev_notes'])) {
            $documentData['monev_notes'] = $data['monev_notes'];
        }

        if (isset($data['monev_status'])) {
            $documentData['monev_status'] = $data['monev_status'];
        }

        // Handle status field separately as it might be named differently
        if (isset($data['status_monev'])) {
            $documentData['status'] = $data['status_monev'];
        }

        if (isset($data['notes'])) {
            $documentData['notes'] = $data['notes'];
        }

        \Log::debug("Document data mapped", ['type' => $type, 'mapped_data' => $documentData]);

        return $documentData;
    }

    /**
     * Get the mapped data for updating the specific document type item.
     *
     * @return array
     */
    public function getMappedItemData()
    {
        $type = $this->route('type');
        $data = $this->validated();
        $mappedData = [];

        switch ($type) {
            case 'publication':
                $fieldMap = [
                    'judul' => 'judul_publikasi',
                    'jenisDokumen/Jurnal/Prosiding/Bagbook' => 'jenis',
                    'statusDokumen' => 'status',
                    'namaJurnal/Prosiding/BagBook' => 'nama_jurnal',
                    'reputasiScopus' => 'reputasi',
                    'linkDokumen' => 'url',
                    'linkDOI' => 'doi',
                    'status_upload' => 'status_upload'
                ];
                break;
            case 'ki':
                $fieldMap = [
                    'judul' => 'judul',
                    'inventor1' => 'inventors1',
                    'inventor2' => 'inventors2',
                    'inventor3' => 'inventors3',
                    'inventor4' => 'inventors4',
                    'inventor5' => 'inventors5',
                    'inventor6' => 'inventors6',
                    'inventor7' => 'inventors7',
                    'inventor8' => 'inventors8',
                    'nonSivitasPRSDI' => 'nonprsdi_inventors',
                    'status' => 'status',
                    'jenis' => 'jenis',
                    'noPendaftaran' => 'no_pendaftaran',
                    'noSertifikat' => 'no_sertifikat',
                    'tanggalSertifikasi' => 'tanggal_sertifikasi',
                    'linkDokumen' => 'link_dokumen',
                    'status_upload' => 'status_upload'
                ];
                break;
            case 'pks':
                $fieldMap = [
                    'pic1' => 'pic_prsdi1',
                    'pic2' => 'pic_prsdi2',
                    'pic3' => 'pic_prsdi3',
                    'picNonPRSDI' => 'pic_nonprsdi',
                    'tipe' => 'tipe',
                    'jenis' => 'jenis',
                    'sumber' => 'sumber',
                    'output' => 'output',
                    'pihakK3' => 'pihak_k3',
                    'nilai' => 'nilai',
                    'keterangan' => 'keterangan',
                    'noKerjasama' => 'no_kerjasama',
                    'tanggalKerjasama' => 'tanggal_kerjasama',
                    'noPerjanjian' => 'no_perjanjian',
                    'tanggalPerjanjian' => 'tanggal_perjanjian',
                    'status_upload' => 'status_upload',
                    'tahunPKS' => 'tahun_pks',
                    'linkBuktiDukung' => 'link_bukti_dukung',
                    'catatan' => 'catatan'
                ];
                break;
            case 'loa':
                $fieldMap = [
                    'namaSDMIptek' => 'nama_sdm_iptek',
                    'jenjangPendidikan' => 'jenjang_pendidikan',
                    'namaUniversitas' => 'nama_universitas',
                    'status' => 'status',
                    'status_upload' => 'status_upload',
                    'keterangan' => 'keterangan',
                    'uploadDakung' => 'upload_dakung',
                    'tahunMasuk' => 'tahun_masuk'
                ];
                break;
            case 'pdvr':
                $fieldMap = [
                    'namaSDMPRSDI' => 'nama_sdm_prsdi',
                    'nonSDMPRSDI' => 'non_sdm_prsdi',
                    'kelompokRiset' => 'kelompok_riset',
                    'status' => 'status',
                    'jenis' => 'jenis',
                    'keterangan' => 'keterangan',
                    'uploadDakung' => 'upload_dakung',
                    'status_upload' => 'status_upload'
                ];
                break;
            case 'purwarupa':
                $fieldMap = [
                    'judulPurwarupa' => 'judul_purwarupa',
                    'kelompokRiset' => 'kelompok_riset',
                    'inventor1' => 'inventor1',
                    'inventor2' => 'inventor2',
                    'inventor3' => 'inventor3',
                    'inventor4' => 'inventor4',
                    'inventor5' => 'inventor5',
                    'nonSivitasPRSDI' => 'non_sivitas_prsdi',
                    'jenis' => 'jenis',
                    'status' => 'status',
                    'status_upload' => 'status_upload',
                    'namaMitra' => 'nama_mitra',
                    'link' => 'link'
                ];
                break;
            default:
                $fieldMap = [];
        }

        // Apply field mapping
        foreach ($data as $key => $value) {
            if (isset($fieldMap[$key])) {
                $dbField = $fieldMap[$key];

                $mappedData[$dbField] = $value;
            }
        }

        \Log::debug("Item data mapped", [
            'type' => $type,
            'original_data_keys' => array_keys($data),
            'mapped_data' => $mappedData
        ]);

        return $mappedData;
    }
}
