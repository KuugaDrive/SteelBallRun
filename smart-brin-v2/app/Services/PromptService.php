<?php

namespace App\Services;

class PromptService
{
    /**
     * Create a dynamic prompt for Mistral AI based on the document type.
     *
     * @param  string  $documentKey The key identifying the document type (e.g., 'publikasi-global').
     * @param  string  $textContent The text extracted from the PDF document.
     * @return string|null The generated prompt string, or null if the document key is invalid.
     */
    public function createPromptForDocument(string $documentKey, string $textContent): ?string
    {
        $baseInstruction = "You are an expert metadata extractor. From the following text, extract the required information and provide it strictly in JSON format. Do not include any explanatory text outside of the JSON object. If a field cannot be found, return an empty string for its value.";

        $fields = $this->getFieldsForDocument($documentKey);

        if (!$fields) {
            return null; 
        }

        return "{$baseInstruction}\n\nHere is the JSON structure to fill: {$fields}\n\nHere is the document text:\n\n---\n{$textContent}\n---";
    }

    /**
     * Get the JSON field structure for a given document key.
     *
     * @param  string  $documentKey
     * @return string|null
     */
    private function getFieldsForDocument(string $documentKey): ?string
    {
        switch ($documentKey) {
            // ====================================
            // Publikasi Global
            // ====================================
            case 'publikasi-global':
                return
                '# PERAN & TUJUAN
                Anda adalah AI spesialis ekstraksi metadata dari dokumen publikasi ilmiah (jurnal, prosiding, book chapter). Tugas Anda adalah membaca teks yang diberikan, lalu mengekstrak informasi yang relevan secara akurat ke dalam struktur JSON yang telah ditentukan.

                # ATURAN OUTPUT
                - Output HARUS berupa objek JSON tunggal yang valid, tanpa komentar atau teks tambahan.
                - Jika sebuah informasi tidak dapat ditemukan di dalam teks, gunakan nilai `null`.
                - Untuk daftar penulis, gunakan format array of strings `[]`.

                # INSTRUKSI EKSTRAKSI FIELD
                - `judul`: Ekstrak judul utama dari publikasi.
                - `kelompokRiset`: Informasi ini adalah klasifikasi internal dan TIDAK AKAN ditemukan di dalam dokumen. Selalu gunakan nilai `null` untuk field ini.
                - `authors`: Ekstrak SEMUA nama penulis berurutan persis seperti yang tertulis di dokumen/publikasi. Output berupa array of objects. Setiap objek memiliki dua field: "nama" (string, sertakan gelar akademik jika ada), dan "is_internal_brin" (boolean, bernilai `true` HANYA jika afiliasi/instansi penulis mengandung frasa "Pusat Riset Sains Data dan Informasi" atau "Badan Riset dan Inovasi Nasional" atau "BRIN", dan `false` jika tidak).
                - `jenisDokumen/Jurnal/Prosiding/Bagbook`: Tentukan tipe dokumen. Gunakan "Jurnal" jika menemukan kata seperti "Journal" atau "Transactions". Gunakan "Prosiding" jika menemukan kata "Proceedings" atau "Conference". Gunakan "Bag Book" jika menemukan kata "Book Chapter".
                - `statusDokumen`: Tentukan statusnya. Gunakan "Published" jika ada detail volume, nomor, halaman, atau tanggal publikasi. Gunakan "Accepted" jika ada kata seperti "accepted for publication" atau "in press".
                - `namaJurnal/Prosiding/BagBook`: Ekstrak nama lengkap dari Jurnal, Konferensi, atau Buku tempat publikasi.
                - `tahun_publikasi`: Ekstrak tahun publikasi (4 digit, contoh: "2024"). Cari pada baris/halaman header/footer, atau pada referensi first-page.
                - `abstrak`: Ekstrak teks abstrak lengkap dari dokumen. Biasanya berada di bawah judul dan nama penulis, diberi label "Abstract" atau "Abstrak".
                - `inti_penelitian`: Buat ringkasan singkat (1-2 kalimat dalam Bahasa Indonesia) yang menggambarkan inti/kontribusi utama penelitian ini berdasarkan abstrak dan isi dokumen.
                - `linkDOI`: Cari dan ekstrak Digital Object Identifier (DOI). Biasanya dimulai dengan "10." atau memiliki label "DOI:".

                # STRUKTUR JSON UNTUK DIISI
                {
                    "judul": "",
                    "kelompokRiset": null,
                    "authors": [
                        { "nama": "", "is_internal_brin": false }
                    ],
                    "jenisDokumen/Jurnal/Prosiding/Bagbook": "",
                    "statusDokumen": "",
                    "namaJurnal/Prosiding/BagBook": "",
                    "tahun_publikasi": "",
                    "abstrak": "",
                    "inti_penelitian": "",
                    "linkDOI": ""
                }';



            // ====================================
            // Kekayaan Intelektual
            // ====================================    
            case 'kekayaan-intelektual':
                return
                '# PERAN & TUJUAN
                Anda adalah AI ahli ekstraksi data yang sangat teliti, berspesialisasi dalam dokumen Kekayaan Intelektual (KI) dari DJKI Indonesia. Tugas Anda adalah membaca teks dari dokumen KI dan mengekstrak informasi secara akurat ke dalam struktur JSON yang diminta.

                # ATURAN OUTPUT
                - Output HARUS berupa objek JSON tunggal yang valid, tanpa komentar atau teks tambahan.
                - Jika sebuah informasi tidak dapat ditemukan di dalam teks, gunakan nilai `null`.

                # INSTRUKSI EKSTRAKSI FIELD
                - `PenciptaDariPusatRisetSainsDataDanInformasi` dan `PenciptaNonPusatRisetSainsDataDanInformasi`:
                    1. Identifikasi setiap individu pencipta secara utuh, TERMASUK SEMUA GELAR mereka (contoh: "Dr. Deden Sumirat Hidayat, M.Kom.").
                    2. Kelompokkan nama-nama tersebut berdasarkan afiliasi mereka.
                    3. Masukkan daftar nama lengkap tersebut sebagai elemen string terpisah di dalam sebuah **JSON Array**.
                    Contoh output yang benar: ["Dr. Deden Sumirat Hidayat, M.Kom.", "Yulia Aris Kartika, M.Kom."]

                - `judulciptaan`: Ekstrak "Judul Invensi" atau "Judul Ciptaan".
                - `kelompokRiset`: Selalu gunakan `null` karena tidak ada di dokumen.
                - `Status`: Gunakan "Tersertifikasi" untuk Hak Cipta, dan "Terdaftar DJKI" untuk Permohonan Paten.
                - `JenisDokumen`: Gunakan "Paten" atau "Hak Cipta" berdasarkan isi dokumen.
                - `nomorPermohonan`: Ekstrak dari "Nomor Permohonan".
                - `tanggalPenerimaan`: Ekstrak dari "Tanggal Penerimaan/Pengajuan" dan format ke `YYYY-MM-DD`.
                - `nomorPencatatan`: Ekstrak "Nomor pencatatan" HANYA untuk Hak Cipta. Gunakan `null` untuk Paten.

                # STRUKTUR JSON UNTUK DIISI
                {
                    "judulciptaan": "",
                    "kelompokRiset": null,
                    "Status": "",
                    "PenciptaDariPusatRisetSainsDataDanInformasi": [],
                    "PenciptaNonPusatRisetSainsDataDanInformasi": [],
                    "JenisDokumen": "",
                    "nomorPermohonan": "",
                    "tanggalPenerimaan": "",
                    "nomorPencatatan": null
                }';


            // ====================================
            // Perjanjian Kerjasama
            // ====================================    
            case 'perjanjian-kerjasama':
                return '{"title": "", "nomorPerjanjian": "", "pihak": "", "lingkup": "", "tanggal": "", "durasi": "", "penanggungJawab": ""}';


            // ====================================
            // Purwarupa
            // ====================================
            case 'purwarupa':
                return
            '# PERAN & TUJUAN
            Anda adalah asisten AI yang ahli dalam mengekstrak metadata dari dokumen teknis, laporan, atau proposal terkait purwarupa (prototype).

            # ATURAN OUTPUT
            - Output HARUS berupa objek JSON tunggal yang valid, tanpa komentar atau teks tambahan.
            - Jika sebuah informasi tidak dapat ditemukan di dalam teks, gunakan nilai `null`.

            # INSTRUKSI EKSTRAKSI FIELD
            - `judulciptaan`: Ekstrak judul utama dari purwarupa, laporan, atau dokumen.
            - `PenciptaDariPusatRisetSainsDataDanInformasi` & `PenciptaNonPusatRisetSainsDataDanInformasi`: Identifikasi setiap pencipta/inventor lengkap dengan semua gelarnya. Kelompokkan berdasarkan afiliasi ("BRIN" atau "Pusat Riset Sains Data dan Informasi" vs lainnya), lalu masukkan nama lengkap ke dalam JSON Array yang sesuai.
            - `jenisPurwarupa`: Cari jenis ciptaan yang disebutkan (misalnya: "Program Komputer").
            - `status`: Cari nomor permohonan (misalnya: Jika "Nomor Permohonan" ada maka pilih "Sertifikasi", jika tidak ada maka pilih "Belum Sertifikasi").
            - `namaMitra`: Jika ada, ekstrak nama mitra industri atau kolaborator.
            - `kelompokRiset`, `linkDrivePWRP`, `linkDirectEvidence`: Informasi ini adalah data eksternal dan tidak akan ada di dalam teks dokumen. Selalu gunakan nilai `null` untuk semua field ini.

            # STRUKTUR JSON UNTUK DIISI
            {
                "judulciptaan": "",
                "PenciptaDariPusatRisetSainsDataDanInformasi": [],
                "PenciptaNonPusatRisetSainsDataDanInformasi": [],
                "kelompokRiset": null,
                "jenisPurwarupa": "",
                "status": "",
                "namaMitra": null,
                "linkDrivePWRP": null,
                "linkDirectEvidence": null
            }';

            // ====================================
            // ===         Studi Lanjut         ===
            // ====================================    
            case 'studi-lanjut':
                return
            '# PERAN & TUJUAN
            Anda adalah asisten AI yang ahli mengekstrak informasi dari dokumen akademik terkait studi lanjut, seperti Letter of Acceptance (LoA), transkrip, atau ijazah.

            # ATURAN OUTPUT
            - Output HARUS berupa objek JSON tunggal yang valid, tanpa komentar atau teks tambahan.
            - Jika sebuah informasi tidak dapat ditemukan di dalam teks, gunakan nilai `null`.

            # INSTRUKSI EKSTRAKSI FIELD
            - `namaMahasiswaAtauPeserta`: Ekstrak nama lengkap mahasiswa yang tertera di dokumen.
            - `programPendidikan`: Identifikasi jenjang pendidikan. Cari kata kunci seperti "Pascasarjana ","Master", "Doctoral", "Ph.D", "S2", "S3", "Magister", atau "Doktor".
            - `namaUniversitasPenerima`: Ekstrak nama lengkap universitas atau institusi pendidikan.
            - `tahunMasuk`: Cari tahun penerimaan, tahun dimulainya studi, atau tanggal efektif dokumen. Ekstrak hanya tahunnya (format YYYY).
            - `status`: Status dibuat secara otomatis berdasarkan field `programPendidikan`.
                - Jika `programPendidikan` teridentifikasi sebagai "S2" atau "Master", maka `status` harus diisi dengan string "ongoing S2".
                - Jika `programPendidikan` teridentifikasi sebagai "S3" atau "Doktor", maka `status` harus diisi dengan string "ongoing S3".
                - Jika jenjang tidak teridentifikasi, gunakan `null`.

            # STRUKTUR JSON UNTUK DIISI
            {
                "namaMahasiswaAtauPeserta": "",
                "programPendidikan": "",
                "namaUniversitasPenerima": "",
                "tahunMasuk": "",
                "status": "",
            }';

            // ====================================
            // Postdoctoral dan Visiting Research
            // ====================================    
            case 'pdvr':
                return
            '# PERAN & TUJUAN
            Anda adalah asisten AI yang ahli dalam mengekstrak informasi dari dokumen terkait program Postdoctoral atau Visiting Research.

            # ATURAN OUTPUT
            - Output HARUS berupa objek JSON tunggal yang valid, tanpa komentar atau teks tambahan.
            - Jika sebuah informasi tidak dapat ditemukan di dalam teks, gunakan nilai `null`.

            # INSTRUKSI EKSTRAKSI FIELD
            - Cari nama lengkap peserta dalam dokumen.
            - Jika afiliasi peserta adalah "BRIN" atau "Pusat Riset Sains Data dan Informasi", masukkan nama tersebut ke field `namaSdmPRSDI` dan biarkan field `namaSdmNonPRSDI` kosong ("").
            - Jika afiliasi peserta BUKAN "BRIN" atau "Pusat Riset Sains Data dan Informasi", masukkan nama tersebut ke field `namaSdmNonPRSDI` dan biarkan field `namaSdmPRSDI` kosong ("").
            - `status`: Tentukan jenis program dengan mencari kata kunci "Postdoctoral" atau "Visiting Research" dalam dokumen. Jika dokumen mengandung kata "Postdoctoral" atau "POST-DOCTORAL", isi field ini dengan "Postdoctoral". Jika dokumen mengandung kata "Visiting Research" atau "Kunjungan", isi field ini dengan "Visiting Research".
            - `lokasiKegiatan`: Tentukan apakah lokasi kegiatan berada di "Dalam Negeri" atau "Luar Negeri".
            - `keterangan`: Tentukan afiliasi peserta sebagai "SDMI" atau "Non SDMI".
            - `status_upload`: Selalu isi dengan "Belum Upload".
            - `linkDataPendukung`: Selalu gunakan nilai `null`.

            # STRUKTUR JSON UNTUK DIISI
            {
                "namaSdmPRSDI": "",
                "namaSdmNonPRSDI": "",
                "status": "",
                "lokasiKegiatan": "",
                "keterangan": "",
                "status_upload": "Belum Upload",
                "linkDataPendukung": null
            }';

            default:
                return null;
        }
    }
}