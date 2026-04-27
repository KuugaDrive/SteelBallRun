export type FieldTemplate = {
    label: string;
    name: string;
    type: 'text' | 'select' | 'date' | 'textarea';
    options?: { value: string; label: string }[];
    placeholder?: string;
    required?: boolean;
    link?: {
        text: string;
        url: string;
    };
};

const generateYearOptions = (startYear?: number, endYear?: number) => {
    const currentYear = new Date().getFullYear();
    const start = startYear || currentYear - 10;
    const end = endYear || currentYear;

    const years = [];
    for (let year = end; year >= start; year--) {
        years.push({ value: year.toString(), label: year.toString() });
    }
    return years;
};

export const fieldTemplates: Record<string, FieldTemplate[]> = {
    // ==============================================
    // PUBLIKASI GLOBAL
    // ==============================================
    Publikasi: [
        { label: 'Judul Publikasi Global', name: 'judul', type: 'text', required: true },
        {
            label: 'Jenis Dokumen Publikasi',
            name: 'jenisDokumen/Jurnal/Prosiding/Bagbook',
            type: 'select',
            required: true,
            options: [
                { value: 'Jurnal', label: 'Jurnal' },
                { value: 'Prosiding', label: 'Prosiding' },
                { value: 'Bag Book', label: 'Bag Book' },
            ],
        },
        {
            label: 'Status Dokumen Publikasi',
            name: 'statusDokumen',
            type: 'select',
            required: true,
            options: [
                { value: 'Published', label: 'Published' },
                { value: 'Accepted', label: 'Accepted' },
            ],
        },
        {
            label: 'Nama Jurnal/Prosiding',
            name: 'namaJurnal/Prosiding/BagBook',
            type: 'text',
            required: true,
            placeholder: 'Contoh: "International Journal of Electrical and Computer Engineering"',
        },
        {
            label: 'Abstrak',
            name: 'abstrak',
            type: 'textarea',
            placeholder: 'Abstrak publikasi...',
        },
        {
            label: 'Inti Penelitian',
            name: 'inti_penelitian',
            type: 'textarea',
            placeholder: 'Ringkasan inti/kontribusi utama penelitian...',
        },
        {
            label: 'Tahun Publikasi',
            name: 'tahun_publikasi',
            type: 'select',
            required: true,
            options: generateYearOptions(2015),
        },
        { label: 'DOI', name: 'linkDOI', type: 'text', placeholder: 'Contoh: "https://doi.org/11.1111/s11111-111-0111-1.1"' },
        { label: 'ISSN', name: 'issn', type: 'text', placeholder: 'Contoh: "1234-5678"' },
        {
            label: 'Quartile',
            name: 'quartile',
            type: 'select',
            options: [
                { value: 'Q1', label: 'Q1' },
                { value: 'Q2', label: 'Q2' },
                { value: 'Q3', label: 'Q3' },
                { value: 'Q4', label: 'Q4' },
                { value: 'Non-Q', label: 'Non-Q' },
            ],
        },
    ],

    // ==============================================
    // KEKAYAAN INTELEKTUAL (KI)
    // ==============================================
    KI: [
        { label: 'Judul Inovasi/Karya', name: 'judulciptaan', type: 'text', required: true },
        {
            label: 'Status',
            name: 'Status',
            type: 'select',
            options: [
                { value: 'Tersertifikasi', label: 'Tersertifikasi' },
                { value: 'Terdaftar DJKI', label: 'Terdaftar DJKI' },
            ],
        },
        {
            label: 'Inventor',
            name: 'PenciptaDariPusatRisetSainsDataDanInformasi',
            type: 'text',
            placeholder: 'Contoh: Arief, S.Kom., M.Kom, Rizki Alfariz',
            required: true,
        },
        {
            label: 'Inventor Non Sivitas PRSDI',
            name: 'PenciptaNonPusatRisetSainsDataDanInformasi',
            type: 'text',
            placeholder: 'Kosongkan jika tidak ada!',
        },
        {
            label: 'Jenis Kekayaan Intelektual',
            name: 'JenisDokumen',
            type: 'select',
            required: true,
            options: [
                { value: 'Hak Cipta', label: 'Hak Cipta' },
                { value: 'Paten', label: 'Paten' },
            ],
        },
        { label: 'Nomor Pendaftaran', name: 'nomorPermohonan', type: 'text', required: true, placeholder: 'Contoh: "EC002024111111"' },
        { label: 'Tanggal Sertifikasi', name: 'tanggalPenerimaan', type: 'date', required: true },
        { label: 'Nomor Sertifikat', name: 'nomorPencatatan', type: 'text', placeholder: 'Jika hak paten, silahkan kosongkan!' },
        { label: 'Link Dokumen', name: 'linkDokumen', type: 'text', placeholder: 'Contoh: https://drive.google.com/' },
        {
            label: 'Sudah unggah dokumen Kekayaan Intelektual di drive?',
            name: 'status_upload',
            type: 'select',
            required: true,
            link: {
                text: 'Upload di sini',
                url: 'https://drive.google.com/drive/folders/kekayaan-intelektual',
            },
            options: [
                { value: 'Sudah', label: 'Sudah' },
                { value: 'Belum', label: 'Belum' },
            ],
        },
    ],

    // ==============================================
    // PERJANJIAN KERJASAMA (PKS) dan DANA EKSTERNAL
    // ==============================================
    PKS: [
        { label: 'Judul', name: 'judul', type: 'text', required: true },
        {
            label: 'PIC Kegiatan (Sivitas PRSDI)',
            name: 'PICKegiatanSivitasPRSDI',
            type: 'text',
            placeholder: 'Contoh: Arief, S.Kom., M.Kom, Rizki Alfariz',
            required: true,
        },
        { label: 'PIC Kegiatan (Non Sivitas PRSDI)', name: 'PICKegiatanNonSivitasPRSDI', type: 'text', placeholder: 'Kosongkan jika tidak ada!' },
        {
            label: 'Tipe',
            name: 'tipe',
            required: true,
            type: 'select',
            options: [
                { value: 'Dana Eksternal', label: 'Dana Eksternal' },
                { value: 'Kerjasama', label: 'Kerjasama' },
                { value: 'Dana Eksternal dan Kerjasama', label: 'Dana Eksternal dan Kerjasama' },
            ],
        },
        {
            label: 'Jenis',
            name: 'jenis',
            required: true,
            type: 'select',
            options: [
                { value: 'Dalam Negeri', label: 'Dalam Negeri' },
                { value: 'Luar Negeri', label: 'Luar Negeri' },
            ],
        },
        { label: 'Sumber', name: 'sumber', type: 'text', placeholder: 'Contoh: RIIM/Mitra/Hibah' },
        {
            label: 'Output',
            name: 'output',
            type: 'select',
            options: [
                { value: 'In Cash', label: 'In Cash' },
                { value: 'In Kind', label: 'In Kind' },
            ],
        },
        { label: 'Pihak K3', name: 'pihakK3', type: 'text', placeholder: 'Contoh: Deputi Bidang Fasilitasi Riset dan Inovasi/Mitra' },
        { label: 'Nilai', name: 'nilai', type: 'text', placeholder: 'Contoh: 100000000, tanpa titik (.) atau koma (,). Jika tidak ada tuliskan: 0' },
        { label: 'Keterangan', name: 'keterangan', type: 'text', placeholder: 'Kosongkan jika tidak ada!' },
        { label: 'No Kerjasama', name: 'noKerjasama', type: 'text', placeholder: 'Kosongkan jika tidak ada!' },
        { label: 'Tanggal Kerjasama', name: 'tglKerjasama', type: 'date' },
        { label: 'No Perjanjian', name: 'noPerjanjian', type: 'text', placeholder: 'Kosongkan jika tidak ada!' },
        { label: 'Link Upload', name: 'linkUpload', type: 'text', required: true, placeholder: 'Contoh: https://drive.google.com/' },
        { label: 'Tanggal Perjanjian', name: 'tglPerjanjian', type: 'date' },
        { label: 'Tahun PKS', name: 'tahunPKS', type: 'select', placeholder: 'Kosongkan jika tidak ada!', options: generateYearOptions(2020) },
        { label: 'Link Data Pendukung', name: 'linkDataPendukung', type: 'text', placeholder: 'Contoh: https://drive.google.com/' },
        {
            label: 'Sudah unggah dokumen PKS / Dana Eksternal di drive?',
            name: 'status_upload',
            type: 'select',
            required: true,
            link: {
                text: 'Upload di sini',
                url: 'https://drive.google.com/drive/folders/pks-dana-eksternal',
            },
            options: [
                { value: 'Sudah', label: 'Sudah' },
                { value: 'Belum', label: 'Belum' },
            ],
        },
    ],

    // ==============================================
    // PURWARUPA
    // ==============================================
    Purwarupa: [
        { label: 'Judul Purwarupa', name: 'judulciptaan', type: 'text', required: true },
        {
            label: 'Inventor',
            name: 'PenciptaDariPusatRisetSainsDataDanInformasi',
            type: 'text',
            placeholder: 'Contoh: Arief, S.Kom., M.Kom, Rizki Alfariz',
            required: true,
        },
        {
            label: 'Inventor Non Sivitas PRSDI',
            name: 'PenciptaNonPusatRisetSainsDataDanInformasi',
            type: 'text',
            placeholder: 'Kosongkan jika tidak ada!',
        },
        { label: 'Jenis Purwarupa', name: 'jenisPurwarupa', type: 'text', required: true, placeholder: 'Contoh: "Program Komputer"' },
        { label: 'Nama Mitra', name: 'namaMitra', type: 'text', required: true, placeholder: 'Contoh: Unit Hemodialisis RSUD Cimacan Cianjur ' },
        {
            label: 'Status',
            name: 'status',
            type: 'select',
            options: [
                { value: 'Sertifikasi', label: 'Sertifikasi' },
                { value: 'Belum Sertifikasi', label: 'Belum Sertifikasi' },
            ],
        },
        { label: 'Link Data Pendukung', name: 'linkDataPendukung', type: 'text', placeholder: 'Contoh: https://drive.google.com/' },
        {
            label: 'Sudah unggah dokumen Purwarupa di drive?',
            name: 'status_upload',
            type: 'select',
            required: true,
            link: {
                text: 'Upload di sini',
                url: 'https://drive.google.com/drive/folders/purwarupa',
            },
            options: [
                { value: 'Sudah', label: 'Sudah' },
                { value: 'Belum', label: 'Belum' },
            ],
        },
    ],

    // ==============================================
    // Studi Lanjut Dalam dan Luar Negeri
    // ==============================================
    StudiLanjut: [
        {
            label: 'Nama SDM Studi Lanjut',
            name: 'namaMahasiswaAtauPeserta',
            type: 'text',
            placeholder: 'Contoh: "Arief, S.Kom., M.Kom" / "Arief"',
            required: true,
        },
        {
            label: 'Jenjang Pendidikan Ditempuh',
            name: 'programPendidikan',
            required: true,
            type: 'select',
            options: [
                { value: 'S2', label: 'S2' },
                { value: 'S3', label: 'S3' },
            ],
        },
        { label: 'Nama Universitas', name: 'namaUniversitasPenerima', type: 'text', required: true, placeholder: 'Contoh: "Universitas Indonesia"' },
        { label: 'Status', name: 'status', type: 'text', required: true, placeholder: 'Contoh: "Tugas Belajar DBR/ongoing S2/ongoing S3"' },
        {
            label: 'Tahun Masuk',
            name: 'tahunMasuk',
            type: 'select',
            required: true,
            options: generateYearOptions(2020),
        },
        { label: 'Keterangan', name: 'keterangan', type: 'text', placeholder: 'Contoh: "Mulai Tugas Belajar bulan Agustus 2025"' },
        { label: 'Link Data Pendukung', name: 'linkDataPendukung', type: 'text', placeholder: 'Contoh: https://drive.google.com/' },
        {
            label: 'Sudah unggah dokumen Studi Lanjut di drive?',
            name: 'status_upload',
            type: 'select',
            required: true,
            link: {
                text: 'Upload di sini',
                url: 'https://drive.google.com/drive/folders/studi-lanjut',
            },
            options: [
                { value: 'Sudah', label: 'Sudah' },
                { value: 'Belum', label: 'Belum' },
            ],
        },
    ],

    // ==============================================
    // PDVR ( Postdoctoral dan Visiting Research )
    // ==============================================
    PDVR: [
        { label: 'Nama SDM PRSDI', name: 'namaSdmPRSDI', type: 'text', placeholder: 'Kosongkan jika tidak ada' },
        { label: 'Nama Non SDM PRSDI', name: 'namaSdmNonPRSDI', type: 'text', placeholder: 'Jika kosong isi dengan: - ' },
        {
            label: 'Status',
            name: 'status',
            type: 'select',
            options: [
                { value: 'POSTDOCTORAL', label: 'POSTDOCTORAL' },
                { value: 'VISITING RESEARCH', label: 'VISITING RESEARCH' },
            ],
        },

        {
            label: 'Lokasi Kegiatan',
            name: 'lokasiKegiatan',
            type: 'select',
            options: [
                { value: 'Dalam Negeri', label: 'Dalam Negeri' },
                { value: 'Luar Negeri', label: 'Luar Negeri' },
            ],
        },
        {
            label: 'Keterangan',
            name: 'keterangan',
            type: 'select',
            options: [
                { value: 'SDMI', label: 'SDMI' },
                { value: 'Non SDMI', label: 'Non SDMI' },
            ],
        },
        { label: 'Link Data Pendukung', name: 'linkDataPendukung', type: 'text', placeholder: 'Contoh: https://drive.google.com/' },
        {
            label: 'Sudah unggah dokumen PDVR di drive?',
            name: 'status_upload',
            type: 'select',
            required: true,
            link: {
                text: 'Upload di sini',
                url: 'https://drive.google.com/drive/folders/pdvr',
            },
            options: [
                { value: 'Sudah', label: 'Sudah' },
                { value: 'Belum', label: 'Belum' },
            ],
        },
    ],
};
