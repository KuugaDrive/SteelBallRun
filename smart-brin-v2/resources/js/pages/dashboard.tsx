import React, { useState } from 'react';

// Import custom components
import KpiCard from '@/components/KpiCard';
import PublicationLineChart from '@/components/charts/PublicationLineChart';
import BarChart from '@/components/charts/BarChart';
import ChartRadarStatus from '@/components/charts/ChartRadarStatus';
import ModifiedPieChartPlaceholder from '@/components/charts/ModifiedPieChartPlaceholder';

// Import komponen Shadcn UI yang sebenarnya
// Pastikan path ini sesuai dengan struktur proyek Anda
import {
    Card,
    CardContent,
} from "@/components/ui/card";

// Menggunakan import aktual seperti yang diminta
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import patternBg from '../assets/bg-pattern3.png'; // Import background pattern

// Helper function to convert research group names to abbreviations
function abbreviateResearchGroup(fullName: string): string {
    const mapping: { [key: string]: string } = {
        'Natural Language Processing': 'NLP',
        'Information Retrieval': 'IR',
        'Knowledge and Data Engineering': 'KDE',
        'Digital Government': 'DG',
        'Human Computer Interaction': 'IMKV',
        'Human Computer Interaction and Visualisation': 'IMKV',
        // Add any additional mappings here
    };

    return mapping[fullName] || fullName;
}

// Helper function to convert university names to abbreviations
function abbreviateUniversityName(fullName: string): string {
    const mapping: { [key: string]: string } = {
        'Universitas Indonesia': 'UI',
        'Institut Teknologi Bandung': 'ITB',
        'Universitas Gadjah Mada': 'UGM',
        'National University of Singapore': 'NUS',
        'Technische Universiteit Delft': 'TU Delft',
        'Seoul National University of Science and Technology': 'SeoulTech',
        // Add any additional university mappings here
    };

    return mapping[fullName] || fullName;
}

// Helper function to transform research group data to use abbreviations
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformResearchGroupData(data: any[]): any[] {
    return data.map(item => {
        const abbreviated = abbreviateResearchGroup(String(item.name));
        return {
            ...item,
            jenis: abbreviated, // Add jenis for ModifiedPieChartPlaceholder compatibility
            displayName: abbreviated
        };
    });
}

// Helper function to transform university data to use abbreviations
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformUniversityData(data: any[]): any[] {
    return data.map(item => {
        const abbreviated = abbreviateUniversityName(String(item.name));
        return {
            ...item,
            displayName: abbreviated
        };
    });
}

// Shadcn UI Tabs components mockup
// (keeping this as you created it yourself)
interface TabsProps {
    defaultValue: string;
    className?: string;
    children: React.ReactNode;
}

const Tabs = ({ defaultValue, className, children }: TabsProps) => {
    const [activeTab, setActiveTab] = useState<string>(defaultValue);
    return (
        <div className={className}>
            {React.Children.map(children, child => {
                if (React.isValidElement(child) && child.type === TabsList) {
                    return React.cloneElement(child as React.ReactElement<TabsListProps>, { activeTab, setActiveTab });
                }
                return child;
            })}
            {React.Children.map(children, child => {
                if (React.isValidElement(child) && child.type === TabsContent) {
                    return React.cloneElement(child as React.ReactElement<TabsContentProps>, { activeTab });
                }
                return null;
            })}
        </div>
    );
};

interface TabsListProps {
    activeTab: string;
    setActiveTab: React.Dispatch<React.SetStateAction<string>>;
    className?: string;
    children: React.ReactNode;
}

const TabsList = ({ activeTab, setActiveTab, className, children }: TabsListProps) => (
    <div className={`flex p-1 rounded-xl shadow border bg-white ${className}`}>
        {React.Children.map(children, child =>
            (React.isValidElement(child) && child.type === TabsTrigger)
                ? React.cloneElement(child as React.ReactElement<TabsTriggerProps>, {
                    isActive: (child.props as TabsTriggerProps).value === activeTab,
                    onClick: () => setActiveTab((child.props as TabsTriggerProps).value)
                })
                : child
        )}
    </div>
);

interface TabsTriggerProps {
    value: string;
    className?: string;
    children: React.ReactNode;
    isActive?: boolean;
    onClick?: () => void;
}

const TabsTrigger = ({ className, children, isActive, onClick }: TabsTriggerProps) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-[#E62F2A] text-white' : 'text-neutral-600 hover:bg-gray-100'} ${className}`}
    >
        {children}
    </button>
);

interface TabsContentProps {
    value: string;
    activeTab: string;
    className?: string;
    children: React.ReactNode;
}

const TabsContent = ({ value, activeTab, className, children }: TabsContentProps) => (
    <div className={`${value === activeTab ? 'block' : 'hidden'} ${className}`}>
        {children}
    </div>
);

// Mock DataTable component
interface DataTableColumn {
    header: string;
    accessor: string;
    render?: (value: string | number | boolean | null | undefined) => React.ReactNode;
}

interface DataTableProps {
    data?: Array<Record<string, unknown>>;
    columns?: DataTableColumn[];
}

const DataTable = ({ data = [], columns = [] }: DataTableProps) => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // No default mock data anymore
    const defaultMockData: Array<Record<string, unknown>> = [];

    // Default columns if none provided
    const defaultMockColumns: DataTableColumn[] = [
        { header: 'ID', accessor: 'id' },
    ];

    const actualData = data.length > 0 ? data : defaultMockData;
    const actualColumns = columns.length > 0 ? columns : defaultMockColumns;

    // Pagination calculations
    const totalItems = actualData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentData = actualData.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const renderPageNumbers = () => {
        const pageNumbers = [];
        const maxVisiblePages = 5;

        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(
                <button
                    key={i}
                    onClick={() => handlePageChange(i)}
                    className={`px-3 py-1 rounded text-sm ${i === currentPage
                            ? 'bg-[#E62F2A] text-white'
                            : 'text-gray-500 hover:bg-gray-100'
                        }`}
                >
                    {i}
                </button>
            );
        }

        return pageNumbers;
    };

    return (
        <div>
            <div className="overflow-auto max-h-96 rounded-lg border">
                <table className="min-w-full text-sm mb-2 border-collapse">
                    <thead>
                        <tr className="text-left text-black bg-gray-100 border-b border-gray-200">
                            {actualColumns.map((col, index) => (
                                <th key={index} className="px-4 py-2 font-semibold">
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {actualData.length > 0 ? (
                            currentData.map((row, rowIndex) => (
                                <tr key={rowIndex} className={`text-neutral-700 ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b border-gray-100`}>
                                    {actualColumns.map((col, colIndex) => (
                                        <td key={colIndex} className="px-4 py-2">
                                            {col.render
                                                ? col.render((row as Record<string, unknown>)[col.accessor] as string | number | boolean | null | undefined)
                                                : String((row as Record<string, unknown>)[col.accessor] || '')}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={actualColumns.length} className="px-4 py-6 text-center text-gray-500">
                                    Tidak ada data yang tersedia
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls - Only show if we have data */}
            {totalItems > 0 && (
                <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
                    <span>
                        Showing data {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} entries
                    </span>
                    <div className="flex gap-1">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`px-3 py-1 rounded text-sm ${currentPage === 1
                                    ? 'text-gray-300 cursor-not-allowed'
                                    : 'bg-[#E62F2A] text-white hover:bg-[#c62828]'
                                }`}
                        >
                            &lt; Prev
                        </button>
                        {renderPageNumbers()}
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`px-3 py-1 rounded text-sm ${currentPage === totalPages
                                    ? 'text-gray-300 cursor-not-allowed'
                                    : 'bg-[#E62F2A] text-white hover:bg-[#c62828]'
                                }`}
                        >
                            Next &gt;
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function getFormattedDate() {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date();
    const day = days[today.getDay()];
    const date = today.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
    return `${day}, ${date}`;
}

interface DashboardProps {
    kpi: {
        totalPublications: number;
        scopusIndexedCount: number;
        publicationAuthorsCount: number;
        activeResearchers: number;
    };
    target: {
        publikasi_ilmiah_global: number;
        kekayaan_intelektual: number;
        purwarupa: number;
        kerjasama_internasional: number;
        kerjasama_nasional: number;
        dana_eksternal: number;
        sdm_studi_lanjut: number;
        postdoc_visiting: number;
        pelatihan_internasional: number;
    } | null;
    charts: {
        publicationsTrend: { name: string; total: number }[];
        publicationTypes: { jenis: string; count: number }[];
        scopusData: { name: string; count: number }[];
        statusData: { category: string; count: number }[];

        // New chart data
        kiByResearchGroup: { name: string; count: number }[];
        kiByStatus: { jenis: string; count: number }[];
        danaEksternalByYear: { name: string | number; count: number }[];
        danaByResearchGroup: { name: string; count: number }[];
        pksJenisData: { jenis: string; count: number }[];
        sdmByDegree: { jenis: string; count: number }[];
        sdmByUniversity: { name: string; count: number }[];

        // Purwarupa data - from PHP controller: purwarupaByGroup
        purwarupaByGroup?: { name: string; count: number }[];

        // For backward compatibility
        purwarupaByResearchGroup?: { name: string; count: number }[];

        purwarupaByStatus: { jenis: string; count: number }[];
        pdvrByType: { name: string; count: number }[];
        pdvrParticipation: { jenis: string; count: number }[];
    };
    tables: {
        publicationsWithNotes: {
            id: number;
            periset: string;
            judul: string;
            catatan: string;
            tahun: number;
            jenis: string;
            status: string;
            user_id: string;
        }[];
        detailPublications: {
            id: number;
            periset: string;
            judul_publikasi: string;
            tahun: number;
            jenis: string;
            status: string;
        }[];
        directPublicationData: {
            id: number;
            periset: string;
            judul_publikasi: string;
            kelompok_riset: string;
            jenis: string;
            status: string;
            nama_jurnal: string;
            reputasi: string;
            doi: string;
            tahun: string;
        }[];
    };
}

export default function DashboardPRSDI({ kpi, target, charts, tables }: DashboardProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
    ];

    const { auth } = usePage<{ auth: { user: { role: string; id: string; name: string } } }>().props;

    // Check if user is a researcher and if there are publications with notes for this researcher
    const isResearcher = auth?.user?.role === 'researcher';

    // Make sure we have the publicationsWithNotes array or provide a default
    const publicationsWithNotes = tables.publicationsWithNotes || [];

    const userNotesCount = isResearcher ?
        publicationsWithNotes.filter(note => note.user_id === auth?.user?.id).length : 0;

    // Set the year for data display consistently across all charts
    const dataYear = 2024;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard Capaian PRSDI" />
            <div
                className="flex h-full flex-1 flex-col gap-4 rounded-xl p-6 overflow-x-auto"
                style={{
                    backgroundImage: `url(${patternBg})`,
                }}
            >
                {/* Notification for researchers with catatan monev */}
                {isResearcher && (
                    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-4 rounded shadow">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">                                    <p className="text-sm text-amber-700">
                                <strong>Perhatian!</strong> Anda memiliki {userNotesCount > 0 ? userNotesCount : 'beberapa'} dokumen dengan catatan dari tim Monev.
                                <a href="/details" className="font-medium underline text-amber-700 hover:text-amber-600 ml-1">
                                    Lihat detail
                                </a>
                            </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="mb-4">
                    <h1 className="text-4xl font-extrabold text-[#E62F2A] mb-1">Dashboard Capaian PRSDI</h1>
                    <div className="text-neutral-500 text-md">{getFormattedDate()}</div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {/* Total Publikasi */}
                    <KpiCard
                        title="Total Publikasi"
                        value={kpi.totalPublications}
                        trend={target && target.publikasi_ilmiah_global > 0 ? {
                            value: ((kpi.totalPublications / target.publikasi_ilmiah_global) * 100 - 100),
                            isPositive: kpi.totalPublications >= target.publikasi_ilmiah_global
                        } : undefined}
                        description={target && target.publikasi_ilmiah_global > 0
                            ? `Capaian: ${kpi.totalPublications} / ${target.publikasi_ilmiah_global} publikasi`
                            : `Capaian: ${kpi.totalPublications} publikasi (target belum ditetapkan)`}
                        progress={{
                            current: kpi.totalPublications,
                            target: target?.publikasi_ilmiah_global,
                            customWidth: target && target.publikasi_ilmiah_global > 0
                                ? `${Math.min(100, (kpi.totalPublications / target.publikasi_ilmiah_global) * 100)}%`
                                : '0%'
                        }}
                    />

                    {/* Perolehan Dana Eksternal */}
                    <KpiCard
                        title="Perolehan Dana Eksternal"
                        value={charts.danaEksternalByYear ?
                            new Intl.NumberFormat('id-ID', {
                                style: 'currency',
                                currency: 'IDR',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0
                            }).format(charts.danaEksternalByYear.reduce((total, item) => total + item.count, 0)) : 'Rp0'
                        }
                        trend={target && target.dana_eksternal > 0 ? {
                            value: (((charts.danaEksternalByYear ? charts.danaEksternalByYear.reduce((total, item) => total + item.count, 0) : 0) / target.dana_eksternal) * 100 - 100),
                            isPositive: (charts.danaEksternalByYear ? charts.danaEksternalByYear.reduce((total, item) => total + item.count, 0) : 0) >= target.dana_eksternal
                        } : undefined}
                        description={target && target.dana_eksternal > 0
                            ? `Capaian: ${Math.round((charts.danaEksternalByYear ? charts.danaEksternalByYear.reduce((total, item) => total + item.count, 0) : 0) / target.dana_eksternal * 100)}% dari target`
                            : 'Target belum ditetapkan'}
                        progress={{
                            current: charts.danaEksternalByYear ? charts.danaEksternalByYear.reduce((total, item) => total + item.count, 0) : 0,
                            target: target?.dana_eksternal,
                            customWidth: target && target.dana_eksternal > 0
                                ? `${Math.min(100, ((charts.danaEksternalByYear ? charts.danaEksternalByYear.reduce((total, item) => total + item.count, 0) : 0) / target.dana_eksternal) * 100)}%`
                                : '0%'
                        }}
                    />

                    {/* Total KI */}
                    <KpiCard
                        title="Total Kekayaan Intelektual"
                        value={charts.kiByStatus ? charts.kiByStatus.reduce((total, item) => total + item.count, 0) : 0}
                        trend={target && target.kekayaan_intelektual > 0 ? {
                            value: (((charts.kiByStatus ? charts.kiByStatus.reduce((total, item) => total + item.count, 0) : 0) / target.kekayaan_intelektual) * 100 - 100),
                            isPositive: (charts.kiByStatus ? charts.kiByStatus.reduce((total, item) => total + item.count, 0) : 0) >= target.kekayaan_intelektual
                        } : undefined}
                        description={target && target.kekayaan_intelektual > 0
                            ? `Capaian: ${charts.kiByStatus ? charts.kiByStatus.reduce((total, item) => total + item.count, 0) : 0} / ${target.kekayaan_intelektual} KI`
                            : `Capaian: ${charts.kiByStatus ? charts.kiByStatus.reduce((total, item) => total + item.count, 0) : 0} KI (target belum ditetapkan)`}
                        progress={{
                            current: charts.kiByStatus ? charts.kiByStatus.reduce((total, item) => total + item.count, 0) : 0,
                            target: target?.kekayaan_intelektual,
                            customWidth: target && target.kekayaan_intelektual > 0
                                ? `${Math.min(100, ((charts.kiByStatus ? charts.kiByStatus.reduce((total, item) => total + item.count, 0) : 0) / target.kekayaan_intelektual) * 100)}%`
                                : '0%'
                        }}
                    />

                    {/* Jumlah Periset Aktif */}
                    <KpiCard
                        title="Jumlah Periset Aktif"
                        value={kpi.activeResearchers}
                        trend={{
                            value: 2.89,
                            isPositive: true
                        }}
                        description="vs. previous month"
                        progress={{
                            current: 78,
                            customWidth: '78%'
                        }}
                    />
                </div>

                {/* Chart Tabs - Using Shadcn Tabs */}
                <Tabs defaultValue="publikasi" className="w-full space-y-4">
                    <TabsList activeTab={""} setActiveTab={() => { }} className="bg-white rounded-xl shadow border p-1 w-fit">
                        <TabsTrigger value="publikasi" className="data-[state=active]:bg-[#E62F2A] data-[state=active]:text-white rounded-lg px-4 py-2">Publikasi</TabsTrigger>
                        <TabsTrigger value="ki" className="data-[state=active]:bg-[#E62F2A] data-[state=active]:text-white rounded-lg px-4 py-2">KI</TabsTrigger>
                        <TabsTrigger value="dana" className="data-[state=active]:bg-[#E62F2A] data-[state=active]:text-white rounded-lg px-4 py-2">Dana Eksternal</TabsTrigger>
                        <TabsTrigger value="sdm" className="data-[state=active]:bg-[#E62F2A] data-[state=active]:text-white rounded-lg px-4 py-2">SDM Studi</TabsTrigger>
                        <TabsTrigger value="purwarupa" className="data-[state=active]:bg-[#E62F2A] data-[state=active]:text-white rounded-lg px-4 py-2">Purwarupa</TabsTrigger>
                        <TabsTrigger value="pdvr" className="data-[state=active]:bg-[#E62F2A] data-[state=active]:text-white rounded-lg px-4 py-2">PDVR</TabsTrigger>
                    </TabsList>

                    {/* Tab Content: Publikasi */}
                    <TabsContent value="publikasi" activeTab={""} className="space-y-4">
                        <PublicationLineChart
                            title="Perkembangan Publikasi per Bulan"
                            data={charts.publicationsTrend || []}
                            className="w-full min-h-[400px]"
                            dropdown
                            dataYear={dataYear}
                        />
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <ModifiedPieChartPlaceholder
                                title="Jenis Publikasi"
                                className="w-full min-h-[400px]"
                                data={charts.publicationTypes || []}
                                dataYear={dataYear}
                                footerNote="Menampilkan distribusi publikasi berdasarkan jenis (jurnal, prosiding, dll)"
                            />
                            <BarChart
                                title="Publikasi Scopus per Quartile"
                                data={charts.scopusData || []}
                                className="w-full min-h-[400px] overflow-x-auto"
                                layout="horizontal"
                                dataYear={dataYear}
                                footerNote="Q1-Q4 menunjukkan quartile jurnal Scopus berdasarkan peringkat. Data diambil dari kolom 'reputasi'."
                            />
                            <ChartRadarStatus
                                data={charts.statusData || []}
                                className="w-full min-h-[400px]"
                                dataYear={dataYear}
                                footerNote="Status publikasi berdasarkan tahapan (submitted, accepted, published, dll)" />
                        </div>
                    </TabsContent>

                    {/* Tab Content: KI */}
                    <TabsContent value="ki" activeTab={""} className="space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <BarChart
                                title="Jumlah KI per Kelompok Riset"
                                data={transformResearchGroupData(charts.kiByResearchGroup || [])}
                                className="w-full min-h-[500px] overflow-x-auto"
                                dataYear={dataYear}
                                footerNote="Distribusi kekayaan intelektual berdasarkan kelompok riset PRSDI"
                            />
                            <ModifiedPieChartPlaceholder
                                title="Status KI"
                                className="w-full min-h-[400px]"
                                data={charts.kiByStatus || []}
                                dataYear={dataYear}
                                footerNote="Persentase KI berdasarkan status pendaftaran dan perolehan"
                            />
                        </div>
                    </TabsContent>

                    {/* Tab Content: Dana Eksternal */}
                    <TabsContent value="dana" activeTab={""} className="space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <BarChart
                                title="Dana Berdasarkan Kelompok Riset"
                                data={transformResearchGroupData(charts.danaByResearchGroup || [])}
                                className="w-full min-h-[400px] overflow-x-auto"
                                layout="horizontal"
                                dataYear={dataYear}
                                tickValues={[500000000, 1000000000, 1500000000, 2000000000, 2500000000, 3000000000]}
                                footerNote="Nilai dana eksternal yang diperoleh masing-masing kelompok riset (dalam Rupiah)"
                            />
                            <ModifiedPieChartPlaceholder
                                title="Jenis Kerjasama"
                                className="w-full min-h-[400px]"
                                data={charts.pksJenisData || []}
                                footerNote="Distribusi dana berdasarkan jenis kerjasama (dalam/luar negeri)"
                            />
                        </div>
                    </TabsContent>

                    {/* Tab Content: SDM Studi */}
                    <TabsContent value="sdm" activeTab={""} className="space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <ModifiedPieChartPlaceholder
                                title="Jenjang Studi SDM"
                                className="w-full min-h-[400px]"
                                data={charts.sdmByDegree || []}
                                footerNote="Persentase SDM berdasarkan jenjang studi yang ditempuh (S2/S3/Postdoc)"
                            />
                            <BarChart
                                title="Universitas Tujuan"
                                data={transformUniversityData(charts.sdmByUniversity || [])}
                                className="w-full min-h-[400px] overflow-x-auto"
                                dataYear={dataYear}
                                footerNote="Jumlah SDM berdasarkan universitas tempat studi lanjut"
                            />
                        </div>
                    </TabsContent>

                    {/* Tab Content: Purwarupa */}
                    <TabsContent value="purwarupa" activeTab={""} className="space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <BarChart
                                title={`Jumlah Purwarupa per Kelompok Riset`}
                                data={transformResearchGroupData(
                                    (charts.purwarupaByGroup || charts.purwarupaByResearchGroup || [])
                                )}
                                className="w-full min-h-[400px] overflow-x-auto"
                                dataYear={dataYear}
                                footerNote="Distribusi jumlah purwarupa yang dihasilkan oleh tiap kelompok riset"
                            />
                            <ModifiedPieChartPlaceholder
                                title="Status Purwarupa"
                                className="w-full min-h-[400px]"
                                data={charts.purwarupaByStatus || []}
                                footerNote="Persentase purwarupa berdasarkan status pengembangan"
                            />
                        </div>
                    </TabsContent>

                    {/* Tab Content: PDVR */}
                    <TabsContent value="pdvr" activeTab={""} className="space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <BarChart
                                title="Jumlah PDVR per Jenis"
                                data={(charts.pdvrByType || []).map(item => ({
                                    ...item,
                                    displayName: item.name
                                }))}
                                className="w-full min-h-[400px] overflow-x-auto"
                                dataYear={dataYear}
                                footerNote="Distribusi PDVR berdasarkan jenis kegiatan (postdoc/visiting/pelatihan)"
                            />
                            <ModifiedPieChartPlaceholder
                                title="Keterlibatan SDM vs Non-SDM"
                                className="w-full min-h-[400px]"
                                data={charts.pdvrParticipation || []}
                                footerNote="Perbandingan keterlibatan SDM PRSDI dan non-SDM PRSDI dalam PDVR"
                            />
                        </div>
                    </TabsContent>
                </Tabs>

                {/* DataTable for Publikasi Detail - Using Shadcn Card and custom DataTable */}
                <Card className="shadow-lg rounded-xl">
                    <CardContent className="p-4">
                        <div className="font-bold mb-2 text-[#E62F2A]">
                            {isResearcher ? 'Publikasi Anda dengan Catatan Monev' : 'Publikasi dengan Catatan Monev'}
                        </div>

                        {/* Tampilkan pesan jika tidak ada data catatan */}
                        {(!publicationsWithNotes || publicationsWithNotes.length === 0) && (
                            <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
                                Tidak ada publikasi dengan catatan monev saat ini.
                            </div>
                        )}

                        {/* Tampilkan tabel hanya jika ada data */}
                        {publicationsWithNotes && publicationsWithNotes.length > 0 && (
                            <DataTable
                                data={isResearcher
                                    ? (publicationsWithNotes || []).filter(item =>
                                        item?.user_id === auth.user.id &&
                                        item?.catatan &&
                                        item.catatan !== '-' &&
                                        item.catatan.trim() !== '')
                                    : (publicationsWithNotes || []).filter(item =>
                                        item?.catatan &&
                                        item.catatan !== '-' &&
                                        item.catatan.trim() !== '')}
                                columns={[
                                    { header: 'No.', accessor: 'id' },
                                    { header: 'Periset', accessor: 'periset' },
                                    { header: 'Judul Publikasi', accessor: 'judul' },
                                    {
                                        header: 'Catatan', accessor: 'catatan',
                                        render: (value) => (
                                            <div className="max-w-md overflow-hidden text-ellipsis p-2 bg-amber-50 border-l-4 border-amber-500 rounded">
                                                {String(value || '')}
                                            </div>
                                        )
                                    },
                                    { header: 'Tahun', accessor: 'tahun' },
                                    { header: 'Jenis', accessor: 'jenis' },
                                    { header: 'Status', accessor: 'status' }
                                ]}
                            />
                        )}
                    </CardContent>
                </Card>

                {/* Data Langsung dari document_publications */}
                <Card className="shadow-lg rounded-xl mb-6">
                    <CardContent className="p-4">
                        <div className="font-bold mb-2 text-[#E62F2A]">Daftar Publikasi Terbaru</div>

                        {/* Tampilkan pesan jika tidak ada data publikasi */}
                        {(!tables.directPublicationData || tables.directPublicationData.length === 0) && (
                            <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
                                Tidak ada data publikasi terbaru saat ini.
                            </div>
                        )}

                        {/* Tampilkan tabel hanya jika ada data */}
                        {tables.directPublicationData && tables.directPublicationData.length > 0 && (
                            <DataTable
                                data={tables.directPublicationData || []}
                                columns={[
                                    { header: 'No.', accessor: 'id' },
                                    { header: 'Periset', accessor: 'periset' },
                                    { header: 'Judul Publikasi', accessor: 'judul_publikasi' },
                                    { header: 'Kelompok Riset', accessor: 'kelompok_riset' },
                                    { header: 'Jenis', accessor: 'jenis' },
                                    { header: 'Status', accessor: 'status' },
                                    { header: 'Jurnal', accessor: 'nama_jurnal' },
                                    { header: 'Reputasi', accessor: 'reputasi' },
                                    { header: 'Tahun', accessor: 'tahun' }
                                ]}
                            />
                        )}
                    </CardContent>
                </Card>

            </div>
        </AppLayout>
    );
}
