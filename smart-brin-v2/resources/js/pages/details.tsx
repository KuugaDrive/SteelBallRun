import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Head, usePage, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import patternBg from '../assets/bg-pattern3.png';
import { DocumentUpdateDialog } from '@/components/Details/DocumentUpdateDialog';
import { MonevFeedbackModal } from '@/components/Details/MonevFeedbackModal';
import { transparentScrollbarCSS, transparentScrollbarStyle } from '../styles/scrollbar';
import { FileSpreadsheetIcon } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Definisikan tipe untuk props, termasuk auth
interface User {
    id: string;
    name: string;
    email: string;
    role: 'head' | 'researcher' | 'monev' | 'admin' | 'superadmin';
}

interface SharedProps {
    auth: {
        user: User | null;
    };
    [key: string]: unknown;
}

interface TableRow {
    [key: string]: string | number | boolean | null | undefined;
    unique_id: string; // Changed from optional to required and ensuring it's a string
    No?: string | number;
    item_id?: string;
}

interface DetailsPageProps {
    publications: TableRow[];
    intellectualProperties: TableRow[];
    pksData: TableRow[];
    furtherStudyData: TableRow[];
    overseasTrainingData: TableRow[];
    purwarupaData: TableRow[];
}

type MonevDocument = {
    id: string;
    type: string;
    notes: string;
    status: string;
    isLocked: boolean;
    revisionCount: number;
    isStamped: boolean;
};

export default function Details() {
    const breadcrumbs: BreadcrumbItem[] = [{ title: 'Details', href: '/details' }];

    const tabs = [
        { id: 'publikasi', title: 'Publikasi Global PRSDI', type: 'publication' },
        { id: 'ki', title: 'Kekayaan Intelektual PRSDI', type: 'ki' },
        { id: 'dana-eksternal', title: 'DANA EKSTERNAL PRSDI', type: 'pks' },
        { id: 'sdm-studi', title: 'SDM Studi PRSDI', type: 'loa' },
        { id: 'purwarupa', title: 'PURWARUPA PRSDI', type: 'purwarupa' },
        { id: 'pdvr', title: 'PDVR PRSDI', type: 'pdvr' },
    ];

    const [activeTab, setActiveTab] = useState('publikasi');
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;
    
    // State for research group filter
    const [selectedResearchGroup, setSelectedResearchGroup] = useState<string>('all');
    const [filteredData, setFilteredData] = useState<TableRow[]>([]);
    
    // State untuk export menu
    const [showExportMenu, setShowExportMenu] = useState(false);
    const exportButtonRef = useRef<HTMLButtonElement>(null);
    const exportMenuRef = useRef<HTMLDivElement>(null);

    // State untuk dialog update
    const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
    const [currentDocumentData, setCurrentDocumentData] = useState<Record<string, unknown>>({});
    const [currentDocumentType, setCurrentDocumentType] = useState('');

    // State untuk monev feedback modal
    const [monevFeedbackOpen, setMonevFeedbackOpen] = useState(false);
    const [selectedMonevDocument, setSelectedMonevDocument] = useState<MonevDocument | null>(null);

    const getItemIdFromRecord = (record: Record<string, unknown>) => {
        const rawId = record.item_id ?? record.No;
        if (rawId !== null && rawId !== undefined) {
            const normalizedId = String(rawId).trim();
            if (normalizedId !== '' && normalizedId !== '-') {
                return normalizedId;
            }
        }

        const uniqueId = String(record.unique_id || '');
        const firstDashIndex = uniqueId.indexOf('-');
        if (firstDashIndex > -1) {
            const extractedId = uniqueId.slice(firstDashIndex + 1).trim();
            if (extractedId !== '') {
                return extractedId;
            }
        }

        return null;
    };

    // Handle click outside untuk menutup dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                exportMenuRef.current && 
                exportButtonRef.current &&
                !exportMenuRef.current.contains(event.target as Node) && 
                !exportButtonRef.current.contains(event.target as Node)
            ) {
                setShowExportMenu(false);
            }
        }
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const { props: pageProps } = usePage<SharedProps & DetailsPageProps>();
    const {
        publications = [],
        intellectualProperties = [],
        pksData = [],
        furtherStudyData = [],
        overseasTrainingData = [],
        purwarupaData = [],
    } = pageProps;

    useEffect(() => {
        setCurrentPage(1);
        
        // Reset research group filter when changing tabs
        setSelectedResearchGroup('all');
    }, [activeTab]);
    
    // Get unique research groups from the current tab's data
    const researchGroups = useMemo(() => {
        let currentData: TableRow[] = [];
        
        switch (activeTab) {
            case 'publikasi':
                currentData = publications;
                break;
            case 'ki':
                currentData = intellectualProperties;
                break;
            case 'dana-eksternal':
                currentData = pksData;
                break;
            case 'sdm-studi':
                currentData = furtherStudyData;
                break;
            case 'purwarupa':
                currentData = purwarupaData;
                break;
            case 'pdvr':
                currentData = overseasTrainingData;
                break;
            default:
                currentData = [];
        }
        
        // Find the column name that contains research group info
        // It could be "KELOMPOK RISET" or similar naming
        const researchGroupKeys = ['KELOMPOK RISET', 'Kelompok Riset', 'KELOMPOK_RISET'];
        
        const groups = new Set<string>();
        groups.add('all'); // Default option to show all
        
        currentData.forEach(row => {
            for (const key of researchGroupKeys) {
                const value = row[key];
                if (value && typeof value === 'string' && value.trim() !== '') {
                    groups.add(value);
                    break;
                }
            }
        });
        
        return Array.from(groups);
    }, [activeTab, publications, intellectualProperties, pksData, furtherStudyData, purwarupaData, overseasTrainingData]);
    
    // Filter data based on selected research group
    useEffect(() => {
        let currentData: TableRow[] = [];
        
        switch (activeTab) {
            case 'publikasi':
                currentData = publications;
                break;
            case 'ki':
                currentData = intellectualProperties;
                break;
            case 'dana-eksternal':
                currentData = pksData;
                break;
            case 'sdm-studi':
                currentData = furtherStudyData;
                break;
            case 'purwarupa':
                currentData = purwarupaData;
                break;
            case 'pdvr':
                currentData = overseasTrainingData;
                break;
            default:
                currentData = [];
        }
        
        if (selectedResearchGroup === 'all') {
            setFilteredData(currentData);
        } else {
            // Find the column name that contains research group info
            const researchGroupKeys = ['KELOMPOK RISET', 'Kelompok Riset', 'KELOMPOK_RISET'];
            
            const filtered = currentData.filter(row => {
                for (const key of researchGroupKeys) {
                    const value = row[key];
                    if (value && typeof value === 'string' && value === selectedResearchGroup) {
                        return true;
                    }
                }
                return false;
            });
            
            setFilteredData(filtered);
        }
        
        // Reset to first page when filter changes
        setCurrentPage(1);
    }, [activeTab, selectedResearchGroup, publications, intellectualProperties, pksData, furtherStudyData, purwarupaData, overseasTrainingData]);

    let tableProps: { title: string; columns: string[]; data: TableRow[]; type: string } = { title: '', columns: [], data: [], type: '' };

    // Update definisi kolom untuk setiap tab di komponen Details
    if (activeTab === 'publikasi') {
        tableProps = {
            title: 'Publikasi Global PRSDI',
            columns: [
                'No',
                'Periode Input',
                'Monev Stamp',
                'Bulan Monev',
                'Judul Publikasi Global',
                'Kelompok Riset',
                'Author 1',
                'Author 2',
                'Author 3',
                'Author 4',
                'Author 5',
                'Author 6',
                'Author 7',
                'Author Non-PRSDI',
                'Jenis',
                'Status',
                'Nama Jurnal/Prosiding',
                'Terindeks Scopus',
                'Reputasi',
                'File di Google Drive',
                'URL',
                'DOI',
                'Status Monev', // Tambahkan kolom Status Monev
                'Catatan Monev', // Tambahkan kolom Catatan Monev
            ],
            data: selectedResearchGroup === 'all' ? publications : filteredData,
            type: 'publication',
        };
    } else if (activeTab === 'ki') {
        tableProps = {
            title: 'Kekayaan Intelektual PRSDI',
            columns: [
                'No',
                'Periode Input',
                'Monev Stamp',
                'Bulan Monev',
                'Judul',
                'Kelompok Riset',
                'Inventor 1',
                'Inventor 2',
                'Inventor 3',
                'Inventor 4',
                'Inventor 5',
                'Inventor 6',
                'Inventor 7',
                'Inventor 8',
                'Non Sivitas PRSDI',
                'Status',
                'Jenis',
                'No Pendaftaran',
                'Tanggal Daftar',
                'No Sertifikat',
                'Tanggal Sertifikasi',
                'Link Upload',
                'LINK Dokumen',
                'Status Monev', // Tambahkan kolom Status Monev
                'Catatan Monev', // Tambahkan kolom Catatan Monev
            ],
            data: selectedResearchGroup === 'all' ? intellectualProperties : filteredData,
            type: 'ki',
        };
    } else if (activeTab === 'dana-eksternal') {
        tableProps = {
            title: 'DANA EKSTERNAL PRSDI',
            columns: [
                'No',
                'Periode Input',
                'Monev Stamp',
                'Bulan Monev',
                'JUDUL',
                'KELOMPOK RISET',
                '1',
                '2',
                '3',
                'NON SIVITAS PRSDI',
                'TIPE',
                'JENIS',
                'SUMBER',
                'OUTPUT',
                'PIHAK K3',
                'NILAI',
                'KETERANGAN',
                'NO KERJASAMA',
                'TANGGAL KERJASAMA',
                'NO PERJANJIAN',
                'TANGGAL PERJANJIAN',
                'LINK UPLOAD',
                'STATUS UPLOAD',
                'TAHUN PKS',
                'LINK BUKTI DUKUNG',
                'CATATAN',
                'Status Monev', // Tambahkan kolom Status Monev
                'Catatan Monev', // Tambahkan kolom Catatan Monev
            ],
            data: selectedResearchGroup === 'all' ? pksData : filteredData,
            type: 'pks',
        };
    } else if (activeTab === 'sdm-studi') {
        tableProps = {
            title: 'SDM Studi PRSDI',
            columns: [
                'No',
                'Monev Stamp',
                'Bulan Monev',
                'NAMA SDM IPTEK',
                'KELOMPOK RISET',
                'JENJANG PENDIDIKAN DITEMPUH',
                'NAMA UNIVERSITAS',
                'STATUS',
                'KETERANGAN',
                'UPLOAD DAKUNG',
                'tahun masuk',
                'direct evidence',
                'Status Monev', // Tambahkan kolom Status Monev
                'Catatan Monev', // Tambahkan kolom Catatan Monev
            ],
            data: selectedResearchGroup === 'all' ? furtherStudyData : filteredData,
            type: 'loa',
        };
    } else if (activeTab === 'purwarupa') {
        tableProps = {
            title: 'PURWARUPA PRSDI',
            columns: [
                'No',
                'Periode Input',
                'Monev Stamp',
                'Bulan Monev',
                'Judul Purwarupa',
                'KELOMPOK RISET',
                'Inventor 1',
                'Inventor 2',
                'Inventor 3',
                'Inventor 4',
                'Inventor 5',
                'NON SIVITAS PRSDI',
                'JENIS',
                'STATUS',
                'NAMA MITRA',
                'UPLOAD GDRIVE',
                'LINK',
                'Status Monev', // Tambahkan kolom Status Monev
                'Catatan Monev', // Tambahkan kolom Catatan Monev
            ],
            data: selectedResearchGroup === 'all' ? purwarupaData : filteredData,
            type: 'purwarupa',
        };
    } else if (activeTab === 'pdvr') {
        tableProps = {
            title: 'PDVR PRSDI',
            columns: [
                'No',
                'Monev Stamp',
                'Bulan Monev',
                'NAMA SDM PRSDI',
                'NON SDM PRSDI',
                'KELOMPOK RISET',
                'STATUS',
                'JENIS',
                'KETERANGAN',
                'UPLOAD DAKUNG',
                'direct link',
                'Status Monev', // Tambahkan kolom Status Monev
                'Catatan Monev', // Tambahkan kolom Catatan Monev
            ],
            data: selectedResearchGroup === 'all' ? overseasTrainingData : filteredData,
            type: 'pdvr',
        };
    }

    // Dapatkan user role untuk rendering kondisional
    const { auth } = pageProps;
    const userRole = auth?.user?.role;
    
    // Tentukan apakah akan menambahkan kolom Aksi berdasarkan peran pengguna
    const showActionColumn = userRole === 'researcher' || userRole === 'head';
    
    // Fungsi untuk mengekspor data ke Excel
    function exportCurrentTabData() {
        let dataToExport: TableRow[] = [];
        let fileName = '';
        
        // Tentukan data berdasarkan tab yang aktif
        switch (activeTab) {
            case 'publikasi':
                dataToExport = selectedResearchGroup === 'all' ? publications : filteredData;
                fileName = 'publikasi_global_prsdi';
                break;
            case 'ki':
                dataToExport = selectedResearchGroup === 'all' ? intellectualProperties : filteredData;
                fileName = 'kekayaan_intelektual_prsdi';
                break;
            case 'dana-eksternal':
                dataToExport = selectedResearchGroup === 'all' ? pksData : filteredData;
                fileName = 'dana_eksternal_prsdi';
                break;
            case 'sdm-studi':
                dataToExport = selectedResearchGroup === 'all' ? furtherStudyData : filteredData;
                fileName = 'sdm_studi_prrsdi';
                break;
            case 'purwarupa':
                dataToExport = selectedResearchGroup === 'all' ? purwarupaData : filteredData;
                fileName = 'purwarupa_prsdi';
                break;
            case 'pdvr':
                dataToExport = selectedResearchGroup === 'all' ? overseasTrainingData : filteredData;
                fileName = 'pdvr_prsdi';
                break;
        }
        
        // Tambahkan suffix research group jika filter diaktifkan
        if (selectedResearchGroup !== 'all') {
            fileName += `_${selectedResearchGroup.toLowerCase().replace(/\s+/g, '_')}`;
        }
        
        // Tambahkan timestamp untuk keunikan file
        const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('T')[0];
        fileName += `_${timestamp}`;
        
        // Buat workbook dan worksheet Excel
        const wb = XLSX.utils.book_new();
        
        // Bersihkan data sebelum ekspor (hapus properti yang tidak perlu)
        const cleanedData = dataToExport.map(row => {
            const cleanRow: Record<string, string | number | boolean | null | undefined> = {};
            
            // Salin properti yang ingin disertakan dalam export
            for (const key in row) {
                // Skip properti yang tidak perlu dieksport
                if (key !== 'unique_id' && !key.startsWith('__')) {
                    cleanRow[key] = row[key];
                }
            }
            
            return cleanRow;
        });
        
        // Buat worksheet dari data yang sudah dibersihkan
        const ws = XLSX.utils.json_to_sheet(cleanedData);
        
        // Tambahkan worksheet ke workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Data');
        
        // Konversi workbook ke binary string
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
        
        // Fungsi untuk mengkonversi binary string ke array buffer
        function s2ab(s: string) {
            const buf = new ArrayBuffer(s.length);
            const view = new Uint8Array(buf);
            for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
            return buf;
        }
        
        // Simpan file dengan FileSaver
        saveAs(new Blob([s2ab(wbout)], { type: 'application/octet-stream' }), `${fileName}.xlsx`);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Detail Capaian PRSDI" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6" style={{ backgroundImage: `url(${patternBg})` }}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                    <div>
                        <h1 className="text-3xl font-bold text-[#E62F2A]">Detail Capaian PRSDI</h1>
                        <p className="text-gray-500 mt-1">Rincian capaian PRSDI berdasarkan data terbaru.</p>
                        {showActionColumn && (
                            <p className="text-sm text-[#E62F2A] mt-2">
                                <i>* Dokumen dengan status "Approved" tidak dapat diubah</i>
                            </p>
                        )}
                    </div>
                    <div className="relative">
                        <button
                            ref={exportButtonRef}
                            type="button"
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            className="flex items-center gap-2 border border-green-600 bg-white text-green-600 hover:bg-green-50 px-4 py-2 rounded-md transition-colors"
                        >
                            <FileSpreadsheetIcon size={18} />
                            Export Data
                        </button>
                        {showExportMenu && (
                            <div 
                                ref={exportMenuRef}
                                className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border"
                            >
                                <div className="py-1">
                                    <button
                                        onClick={() => {
                                            exportCurrentTabData();
                                            setShowExportMenu(false);
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                    >
                                        <FileSpreadsheetIcon size={16} className="text-green-600" />
                                        Export Excel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mb-6 rounded-lg border-b border-gray-200 bg-white p-4 shadow-md">
                    <div className="flex justify-between items-center">
                        <nav className="flex space-x-4">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-4 py-2 text-sm font-medium ${
                                        activeTab === tab.id ? 'border-b-2 border-[#E62F2A] text-[#E62F2A]' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    {tab.title}
                                </button>
                            ))}
                        </nav>
                        
                        {/* Research Group Filter */}
                        <div className="w-64">
                            <select
                                id="researchGroupFilter"
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                value={selectedResearchGroup}
                                onChange={(e) => setSelectedResearchGroup(e.target.value)}
                            >
                                {researchGroups.map((group: string) => (
                                    <option key={group} value={group}>
                                        {group === 'all' ? 'Semua Kelompok Riset' : group}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="rounded-lg bg-white p-6 shadow-md overflow-hidden">
                    
                    <Table
                        title={tableProps.title}
                        columns={showActionColumn ? [...tableProps.columns, 'Aksi'] : tableProps.columns} // Tambahkan kolom Aksi hanya untuk researcher dan head
                        data={tableProps.data}
                        type={tableProps.type}
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                        rowsPerPage={rowsPerPage}
                        onUpdateClick={(data, type) => {
                            // Cek status dokumen sebelum membuka dialog
                            const statusMonev = String(data['Status Monev'] || '').toLowerCase();
                            if (statusMonev === 'approved') {
                                alert('Dokumen yang sudah disetujui tidak dapat diubah.');
                                return;
                            }
                            setCurrentDocumentData(data);
                            setCurrentDocumentType(type);
                            setUpdateDialogOpen(true);
                        }}
                        selectedMonevDocument={selectedMonevDocument}
                        setSelectedMonevDocument={setSelectedMonevDocument}
                        monevFeedbackOpen={monevFeedbackOpen}
                        setMonevFeedbackOpen={setMonevFeedbackOpen}
                    />
                </div>
                
                {/* Dialog untuk update dokumen */}
                <DocumentUpdateDialog
                    open={updateDialogOpen}
                    onClose={() => setUpdateDialogOpen(false)}
                    onSubmit={(data) => {
                        // Mapping frontend field to backend field for all document types
                        const type = currentDocumentType;
                        const mapField = (type: string, key: string) => {
                            // Map for all types, extend as needed
                            const maps: Record<string, Record<string, string>> = {
                                publication: {
                                    judul: 'judul',
                                    authorsCivitasPRSDI: 'authorsCivitasPRSDI',
                                    authorsNonCivitasPRSDI: 'authorsNonCivitasPRSDI',
                                    'jenisDokumen/Jurnal/Prosiding/Bagbook': 'jenisDokumen/Jurnal/Prosiding/Bagbook',
                                    statusDokumen: 'statusDokumen',
                                    'namaJurnal/Prosiding/BagBook': 'namaJurnal/Prosiding/BagBook',
                                    terindeksScopus: 'terindeksScopus',
                                    reputasiScopus: 'reputasiScopus',
                                    linkDokumen: 'linkDokumen',
                                    linkDOI: 'linkDOI',
                                    status_upload: 'status_upload',
                                },
                                ki: {
                                    judulciptaan: 'judul',
                                    Status: 'status',
                                    PenciptaDariPusatRisetSainsDataDanInformasi: 'inventor1',
                                    PenciptaNonPusatRisetSainsDataDanInformasi: 'nonSivitasPRSDI',
                                    JenisDokumen: 'jenis',
                                    nomorPermohonan: 'noPendaftaran',
                                    tanggalPenerimaan: 'tanggalSertifikasi',
                                    nomorPencatatan: 'noSertifikat',
                                    linkDokumen: 'linkDokumen',
                                    status_upload: 'status_upload',
                                },
                                pks: {
                                    judul: 'judul',
                                    PICKegiatanSivitasPRSDI: 'pic1',
                                    PICKegiatanNonSivitasPRSDI: 'picNonPRSDI',
                                    tipe: 'tipe',
                                    jenis: 'jenis',
                                    sumber: 'sumber',
                                    output: 'output',
                                    pihakK3: 'pihakK3',
                                    nilai: 'nilai',
                                    keterangan: 'keterangan',
                                    noKerjasama: 'noKerjasama',
                                    tglKerjasama: 'tanggalKerjasama',
                                    noPerjanjian: 'noPerjanjian',
                                    linkUpload: 'linkUpload',
                                    tglPerjanjian: 'tanggalPerjanjian',
                                    tahunPKS: 'tahunPKS',
                                    linkDataPendukung: 'linkBuktiDukung',
                                    status_upload: 'status_upload',
                                },
                                purwarupa: {
                                    judulciptaan: 'judulPurwarupa',
                                    PenciptaDariPusatRisetSainsDataDanInformasi: 'inventor1',
                                    PenciptaNonPusatRisetSainsDataDanInformasi: 'nonSivitasPRSDI',
                                    jenisPurwarupa: 'jenis',
                                    namaMitra: 'namaMitra',
                                    status: 'status',
                                    linkDataPendukung: 'link',
                                    status_upload: 'status_upload',
                                },
                                loa: {
                                    namaMahasiswaAtauPeserta: 'namaSDMIptek',
                                    programPendidikan: 'jenjangPendidikan',
                                    namaUniversitasPenerima: 'namaUniversitas',
                                    status: 'status',
                                    tahunMasuk: 'tahunMasuk',
                                    keterangan: 'keterangan',
                                    linkDataPendukung: 'uploadDakung',
                                    status_upload: 'status_upload',
                                },
                                pdvr: {
                                    namaSdmPRSDI: 'namaSDMPRSDI',
                                    namaSdmNonPRSDI: 'nonSDMPRSDI',
                                    status: 'status',
                                    lokasiKegiatan: 'lokasiKegiatan',
                                    keterangan: 'keterangan',
                                    linkDataPendukung: 'uploadDakung',
                                    status_upload: 'status_upload',
                                },
                            };
                            return (maps[type] && maps[type][key]) ? maps[type][key] : key;
                        };
                        // Transform data
                        const transformed: Record<string, string> = {};
                        Object.keys(data).forEach((key) => {
                            const backendKey = mapField(type, key);
                            transformed[backendKey] = data[key];
                        });
                        // Ambil XSRF-TOKEN dari cookie
                        const getCookie = (name: string) => {
                            const value = `; ${document.cookie}`;
                            const parts = value.split(`; ${name}=`);
                            if (parts.length === 2) return parts.pop()?.split(';').shift();
                            return null;
                        };
                        const xsrfToken = getCookie('XSRF-TOKEN');
                        if (!xsrfToken) {
                            alert('Error: XSRF-TOKEN tidak ditemukan. Coba refresh halaman.');
                            return;
                        }
                        const statusMonev = String(currentDocumentData['Status Monev'] || '').toLowerCase();
                        const { auth } = pageProps;
                        const userRole = auth?.user?.role;
                        if (!(userRole === 'researcher' || userRole === 'head') || statusMonev === 'approved') {
                            alert('Anda tidak memiliki hak untuk mengubah dokumen ini atau dokumen sudah disetujui.');
                            setUpdateDialogOpen(false);
                            return;
                        }
                        const itemId = getItemIdFromRecord(currentDocumentData);
                        if (!itemId) {
                            alert('ID dokumen tidak valid. Muat ulang halaman lalu coba lagi.');
                            return;
                        }

                        fetch(route('details.update', { type: currentDocumentType, id: itemId }), {
                            method: 'PATCH',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-XSRF-TOKEN': decodeURIComponent(xsrfToken),
                                'Accept': 'application/json',
                            },
                            body: JSON.stringify(transformed),
                            credentials: 'same-origin'
                        })
                        .then(response => {
                            if (!response.ok) {
                                return response.text().then(text => {
                                    throw new Error(`Server responded with ${response.status}: ${text}`);
                                });
                            }
                            return response.json();
                        })
                        .then(data => {
                            alert('Dokumen berhasil diperbarui');
                            setUpdateDialogOpen(false);
                            window.location.reload();
                        })
                        .catch(error => {
                            alert(`Gagal memperbarui dokumen: ${error.message}`);
                        });
                    }}
                    documentData={currentDocumentData}
                    documentType={currentDocumentType}
                />

                {/* Modal untuk Monev Feedback */}
                <MonevFeedbackModal
                    isOpen={monevFeedbackOpen}
                    documentNo={selectedMonevDocument?.id}
                    documentType={selectedMonevDocument?.type || ''}
                    currentNotes={selectedMonevDocument?.notes || ''}
                    currentStatus={selectedMonevDocument?.status || ''}
                    isLocked={selectedMonevDocument?.isLocked || false}
                    revisionCount={selectedMonevDocument?.revisionCount || 0}
                    isStamped={selectedMonevDocument?.isStamped || false}
                    onClose={() => setMonevFeedbackOpen(false)}
                />
            </div>
        </AppLayout>
    );
}

// Utility function to get cookie value
const getCookie = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
};

function Table({
    title,
    columns,
    data,
    type,
    currentPage,
    setCurrentPage,
    rowsPerPage,
    onUpdateClick,
    selectedMonevDocument,
    setSelectedMonevDocument,
    monevFeedbackOpen,
    setMonevFeedbackOpen,
}: {
    title: string;
    columns: string[];
    data: TableRow[];
    type: string;
    currentPage: number;
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
    rowsPerPage: number;
    onUpdateClick?: (data: Record<string, unknown>, type: string) => void;
    selectedMonevDocument?: MonevDocument | null;
    setSelectedMonevDocument?: React.Dispatch<React.SetStateAction<MonevDocument | null>>;
    monevFeedbackOpen?: boolean;
    setMonevFeedbackOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}) {
    const { auth } = usePage<SharedProps>().props;
    const userRole = auth?.user?.role;

    const getRowItemId = (row: TableRow) => {
        const rawId = row.item_id ?? row.No;
        if (rawId !== null && rawId !== undefined) {
            const normalizedId = String(rawId).trim();
            if (normalizedId !== '' && normalizedId !== '-') {
                return normalizedId;
            }
        }

        const uniqueId = String(row.unique_id || '');
        const firstDashIndex = uniqueId.indexOf('-');
        if (firstDashIndex > -1) {
            const extractedId = uniqueId.slice(firstDashIndex + 1).trim();
            if (extractedId !== '') {
                return extractedId;
            }
        }

        return null;
    };



    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedData = data.slice(startIndex, endIndex);
    const totalPages = Math.ceil(data.length / rowsPerPage);

    return (
        <div className="mb-6">
            <style>
                {`
                    ${transparentScrollbarCSS}
                    table td {
                        border: 1px solid #e5e7eb;
                    }
                `}
            </style>
            <h2 className="mb-4 text-xl font-bold text-[#E62F2A]">{title}</h2>
            <div className="transparent-scrollbar max-h-[70vh] overflow-x-auto overflow-y-auto rounded-lg border bg-white shadow-md" style={transparentScrollbarStyle}>
                {/* Style untuk tabel responsive dengan border */}
                <table className="mb-2 border-collapse text-sm w-full min-w-[1200px] table-auto border border-gray-300"> {/* Menggunakan table-auto dan min-width untuk responsivitas */}
                    <thead className="sticky top-0 z-10 bg-gray-100">
                        <tr className="border-b border-gray-300 bg-gray-100 text-left text-black">
                            {columns.map((col, index) => {
                                // Define column width based on content type
                                let columnWidth = "auto";
                                let maxWidth = "none";
                                
                                // Special column width handling
                                if (col === 'No') {
                                    columnWidth = "60px";
                                } else if (col === 'Aksi') {
                                    columnWidth = "80px";
                                } else if (col === 'Monev Stamp' || col === 'Periode Stamp') {
                                    columnWidth = "100px";
                                } else if (col === 'Status' || col === 'Status Monev' || col === 'Bulan Monev') {
                                    columnWidth = "120px";
                                } else if (col === 'Judul Publikasi Global' || 
                                             col === 'Judul' || 
                                             col === 'JUDUL' || 
                                             col === 'Judul Purwarupa') {
                                    columnWidth = "280px";
                                    maxWidth = "280px";
                                } else if (col === 'Catatan Monev') {
                                    columnWidth = "200px";
                                    maxWidth = "200px";
                                } else {
                                    columnWidth = "150px";
                                }
                                
                                return (
                                    <th
                                        key={index}
                                        className="px-4 py-2 font-semibold relative whitespace-nowrap border border-gray-300"
                                        style={{ 
                                            background: '#f3f4f6', 
                                            top: 0, 
                                            zIndex: 10, 
                                            position: 'sticky',
                                            width: columnWidth,
                                            maxWidth: maxWidth
                                        }}
                                    >
                                        {col}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.length > 0 ? (
                            paginatedData.map((row, rowIndex) => (
                                <tr
                                    key={row.unique_id ? String(row.unique_id) : `row-${startIndex + rowIndex}`}
                                    className={`text-neutral-700 ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b border-gray-300`}
                                >
                                    {columns.map((col, colIndex) => {
                                        // Render nomor urut untuk kolom 'No'
                                        if (col === 'No') {
                                            return (
                                                <td
                                                    key={colIndex}
                                                    className="px-4 py-2 whitespace-nowrap border border-gray-300"
                                                >
                                                    {startIndex + rowIndex + 1}
                                                </td>
                                            );
                                        }

                                        // --- LOGIKA STAMP BARU ---
                                        if (col === 'Monev Stamp' || col === 'Periode Stamp') {
                                            const isChecked = row[col] === true;
                                            const itemId = getRowItemId(row);
                                            return (
                                                <td
                                                    key={colIndex}
                                                    className="px-4 py-2 text-center whitespace-nowrap border border-gray-300" // Memastikan teks tidak wrap
                                                >
                                                    {userRole === 'monev' ? (
                                                        <Link
                                                            href={itemId ? route('details.stamp', { type: type, id: itemId }) : '#'}
                                                            method="post"
                                                            as="button"
                                                            preserveScroll
                                                            onBefore={() => {
                                                                if (!itemId) {
                                                                    window.alert('ID dokumen tidak valid. Muat ulang halaman lalu coba lagi.');
                                                                    return false;
                                                                }

                                                                const confirmMessage = isChecked
                                                                    ? `Apakah Anda yakin ingin menghapus tanda periksa dari item ini?\n\nTindakan ini akan menghapus stempel Monev.`
                                                                    : `Apakah Anda yakin ingin menandai item ini sebagai sudah diperiksa?\n\nTindakan ini akan memberikan stempel Monev dan kolom "Bulan Monev" akan menampilkan bulan saat ini.`;

                                                                return window.confirm(confirmMessage);
                                                            }}
                                                            className="flex h-full w-full items-center justify-center"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                readOnly
                                                                className="h-4 w-4 cursor-pointer rounded border-gray-300 text-red-600 focus:ring-red-500"
                                                            />
                                                        </Link>
                                                    ) : (
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            disabled
                                                            className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                                                        />
                                                    )}
                                                </td>
                                            );
                                        }

                                        // --- LOGIKA STATUS ---
                                        if (col.toLowerCase() === 'status') {
                                            const value = row[col] || '-';
                                            let colorClass = 'bg-gray-200 text-gray-700';
                                            
                                            switch (value) {
                                                case 'Submit':
                                                    colorClass = 'bg-blue-100 text-blue-700 font-semibold';
                                                    break;
                                                case 'Accepted':
                                                    colorClass = 'bg-green-100 text-green-700 font-semibold';
                                                    break;
                                                case 'Published':
                                                    colorClass = 'bg-indigo-100 text-indigo-700 font-semibold';
                                                    break;
                                                case 'Review':
                                                    colorClass = 'bg-yellow-100 text-yellow-700 font-semibold';
                                                    break;
                                                case 'Draft':
                                                    colorClass = 'bg-gray-100 text-gray-700 font-semibold';
                                                    break;
                                                case 'Reject':
                                                    colorClass = 'bg-red-100 text-red-700 font-semibold';
                                                    break;
                                            }
                                            
                                            return (
                                                <td
                                                    key={colIndex}
                                                    className="px-4 py-2 whitespace-nowrap border border-gray-300"
                                                >
                                                    <span className={`rounded px-2 py-1 ${colorClass}`}>{value}</span>
                                                </td>
                                            );
                                        }
                                        
                                        // --- LOGIKA BULAN MONEV ---
                                        if (col === 'Bulan Monev') {
                                            // Mengambil nilai dari Periode Stamp jika ada atau dari Bulan jika ada
                                            const value = row['Bulan'] || 
                                                         (row['Periode Stamp'] ? new Date(String(row['Periode Stamp'])).toLocaleString('default', { month: 'long' }) : '-');
                                            // Hanya tampilkan bulan jika ada monev stamp
                                            const isStamped = row['Monev Stamp'] === true;
                                            
                                            return (
                                                <td
                                                    key={colIndex}
                                                    className="px-4 py-2 whitespace-nowrap border border-gray-300"
                                                >
                                                    {isStamped ? (
                                                        <span className="rounded bg-blue-50 px-2 py-1 text-blue-700 font-medium">{value}</span>
                                                    ) : (
                                                        <span className="text-gray-500">-</span>
                                                    )}
                                                </td>
                                            );
                                        }
                                        
                                        // --- LOGIKA STATUS MONEV ---
                                        if (col === 'Status Monev') {
                                            const monevStatus = String(row['Status Monev'] || '-');
                                            const isStamped = row['Monev Stamp'] === true;
                                            const isLocked = row['Is Locked For Monev'] === true;
                                            const revisionCount = Number(row['Revision Count'] || 0);
                                            
                                            let colorClass = 'bg-gray-200 text-gray-700';
                                            
                                            // Tentukan warna berdasarkan status
                                            switch (monevStatus.toLowerCase()) {
                                                case 'approved':
                                                    colorClass = 'bg-green-100 text-green-700 font-semibold';
                                                    break;
                                                case 'rejected':
                                                case 'needs_revision':
                                                    colorClass = 'bg-yellow-100 text-yellow-700 font-semibold';
                                                    break;
                                                case 'pending':
                                                default:
                                                    colorClass = 'bg-gray-200 text-gray-700';
                                            }
                                            
                                            const handleMonevClick = () => {
                                                console.log('✓ Button clicked! userRole:', userRole);
                                                if (setSelectedMonevDocument && setMonevFeedbackOpen) {
                                                    setSelectedMonevDocument({
                                                        id: getRowItemId(row) ?? '',
                                                        type: type,
                                                        notes: String(row['Catatan Monev'] || ''),
                                                        status: monevStatus === '-' || monevStatus === 'pending' ? '' : monevStatus,
                                                        isLocked: isLocked,
                                                        revisionCount: revisionCount,
                                                        isStamped: isStamped,
                                                    });
                                                    setMonevFeedbackOpen(true);
                                                    console.log('✓ Modal should open now');
                                                } else {
                                                    console.error('✗ setters not available:', { setSelectedMonevDocument, setMonevFeedbackOpen });
                                                }
                                            };
                                            
                                            return (
                                                <td
                                                    key={colIndex}
                                                    className="px-4 py-2 whitespace-nowrap border border-gray-300"
                                                    style={{ width: '120px' }}
                                                >
                                                    {userRole === 'monev' ? (
                                                        <button
                                                            type="button"
                                                            onClick={handleMonevClick}
                                                            className={`w-full rounded px-2 py-1 text-sm font-semibold cursor-pointer hover:opacity-80 transition-opacity ${colorClass}`}
                                                            style={{ 
                                                                minHeight: '32px',
                                                                display: 'block',
                                                                width: '100%'
                                                            }}
                                                        >
                                                            {monevStatus === '-' || monevStatus === 'pending' ? 'Set Status' : monevStatus}
                                                        </button>
                                                    ) : (
                                                        <span className={`rounded px-2 py-1 ${colorClass}`}>{monevStatus}</span>
                                                    )}
                                                </td>
                                            );
                                        }
                                        
                                        // --- LOGIKA CATATAN MONEV ---
                                        if (col === 'Catatan Monev') {
                                            const catatanText = String(row[col] !== null && row[col] !== undefined ? row[col] : '-');
                                            return (
                                                <td
                                                    key={colIndex}
                                                    className="px-4 py-2 border border-gray-300"
                                                    style={{ maxWidth: '200px' }}
                                                >
                                                    <div className="break-words w-full text-sm">
                                                        {userRole === 'monev' ? (
                                                            <button
                                                                onClick={() => {
                                                                    const monevStatus = String(row['Status Monev'] || '-');
                                                                    const isStamped = row['Monev Stamp'] === true;
                                                                    const isLocked = row['Is Locked For Monev'] === true;
                                                                    const revisionCount = Number(row['Revision Count'] || 0);

                                                                    if (setSelectedMonevDocument && setMonevFeedbackOpen) {
                                                                        setSelectedMonevDocument({
                                                                            id: getRowItemId(row) ?? '',
                                                                            type: type,
                                                                            notes: catatanText === '-' ? '' : catatanText,
                                                                            status: monevStatus === '-' || monevStatus === 'pending' ? '' : monevStatus,
                                                                            isLocked: isLocked,
                                                                            revisionCount: revisionCount,
                                                                            isStamped: isStamped,
                                                                        });
                                                                        setMonevFeedbackOpen(true);
                                                                    }
                                                                }}
                                                                className="text-left w-full hover:bg-gray-100 p-1 rounded cursor-pointer"
                                                            >
                                                                {catatanText === '-' ? 
                                                                    <span className="text-gray-500 italic">Click to add notes</span> : 
                                                                    <span className="whitespace-pre-line">{catatanText}</span>
                                                                }
                                                            </button>
                                                        ) : (
                                                            <div className="whitespace-pre-line">{catatanText}</div>
                                                        )}
                                                    </div>
                                                </td>
                                            );
                                        }
                                        
                                        // --- KOLOM AKSI ---
                                        if (col === 'Aksi') {
                                            // Hanya tampilkan update button untuk researcher atau head
                                            // Dan hanya jika status monev tidak "approved"
                                            const statusMonev = String(row['Status Dokumen'] || '').toLowerCase();
                                            const canUpdate = (userRole === 'researcher' || userRole === 'head') && statusMonev !== 'approved';
                                            
                                            return (
                                                <td
                                                    key={colIndex}
                                                    className="px-4 py-2 whitespace-nowrap text-center border border-gray-300"
                                                    style={{ width: '80px' }}
                                                >
                                                    {canUpdate ? (
                                                        <button
                                                            className="rounded bg-[#E62F2A] px-3 py-1 text-xs text-white hover:bg-red-700 transition duration-200"
                                                            onClick={() => onUpdateClick && onUpdateClick(row, type)}
                                                            title={statusMonev === 'approved' ? "Tidak dapat mengubah dokumen yang sudah disetujui" : "Update dokumen"}
                                                        >
                                                            Update
                                                        </button>
                                                    ) : (
                                                        statusMonev === 'approved' ? 
                                                        <span className="text-xs text-gray-500 italic">Disetujui</span> : 
                                                        <span className="text-xs text-gray-500 italic">-</span>
                                                    )}
                                                </td>
                                            );
                                        }
                                        
                                        // --- KOLOM LAIN ---
                                        return (
                                            <td
                                                key={colIndex}
                                                className={`px-4 py-2 border border-gray-300 ${
                                                    col === 'Judul Publikasi Global' || 
                                                    col === 'Judul' || 
                                                    col === 'JUDUL' || 
                                                    col === 'Judul Purwarupa' ? 
                                                    'break-words' : 'whitespace-nowrap'
                                                }`}
                                                style={{
                                                    maxWidth: col === 'Judul Publikasi Global' || 
                                                               col === 'Judul' || 
                                                               col === 'JUDUL' || 
                                                               col === 'Judul Purwarupa' ? '280px' : 'auto',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}
                                            >
                                                {row[col] !== null && row[col] !== undefined ? String(row[col]) : '-'}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length} className="px-4 py-4 text-center text-gray-500">
                                    Tidak ada data yang tersedia
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                <span>
                    Showing data {data.length === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, data.length)} of {data.length} entries
                </span>
                <div className="flex gap-2">
                    <button
                        className="rounded px-2 py-1 text-gray-500 hover:bg-gray-100"
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                    >
                        ‹
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .map((pageNum) => (
                            <button
                                key={pageNum}
                                className={`rounded px-2 py-1 ${currentPage === pageNum ? 'bg-red-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                                onClick={() => setCurrentPage(pageNum)}
                            >
                                {pageNum}
                            </button>
                        ))
                        .slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))}
                    {totalPages > currentPage + 2 && (
                        <>
                            <span className="px-2 py-1 text-gray-500">...</span>
                            <button className="rounded px-2 py-1 text-gray-500 hover:bg-gray-100" onClick={() => setCurrentPage(totalPages)}>
                                {totalPages}
                            </button>
                        </>
                    )}
                    <button
                        className="rounded px-2 py-1 text-gray-500 hover:bg-gray-100"
                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages || totalPages === 0}
                    >
                        ›
                    </button>
                </div>
            </div>
        </div>
    );
}
