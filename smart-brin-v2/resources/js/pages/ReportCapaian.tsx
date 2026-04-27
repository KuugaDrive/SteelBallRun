/* resources/js/pages/report-capaian.tsx */
import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { FileSpreadsheetIcon, FilterIcon, TrendingUpIcon, TrendingDownIcon, FileTextIcon, FileIcon } from 'lucide-react';
import patternBg from '../assets/bg-pattern3.png'; // Import background pattern
import type { BreadcrumbItem } from '@/types';

  /* ---------- tipe props dari Inertia ---------- */
  interface Props {
    tahun: number;
    bulan: number | null;
    triwulan: number | null;
    capaian: Record<string, number>;
    target: Record<string, number>;
  }

  /* ---------- label indikator untuk tabel ---------- */
  const indikatorLabels: Record<string, string> = {
    kekayaan_intelektual: 'Kekayaan Intelektual',
    publikasi_ilmiah_global: 'Publikasi Ilmiah Global',
    purwarupa: 'Purwarupa',
    kerjasama_internasional: 'Kerjasama Internasional',
    kerjasama_nasional: 'Kerjasama Nasional',
    dana_eksternal: 'Dana Eksternal (Rp)',
    sdm_studi_lanjut: 'SDM Studi Lanjut',
    postdoc_visiting: 'Postdoc / Visiting',
    pelatihan_internasional: 'Pelatihan Internasional',
  };

  export default function ReportCapaian({
    tahun,
    bulan,
    triwulan,
    capaian,
    target,
  }: Props) {
    /* ------------- state filter ------------- */
    const [scope, setScope] = useState<'tahun' | 'bulan' | 'triwulan'>(
      bulan ? 'bulan' : triwulan ? 'triwulan' : 'tahun'
    );
    const [filter, setFilter] = useState<{
      tahun: number;
      bulan: string; // kosong = tidak dipakai
      triwulan: string;
    }>({
      tahun,
      bulan: bulan ? String(bulan) : '',
      triwulan: triwulan ? String(triwulan) : '',
    });
    const [showExportMenu, setShowExportMenu] = useState(false);

    /* ------------- helper konversi query ------------- */
    const buildQuery = () =>
      new URLSearchParams(
        Object.fromEntries(
          Object.entries(filter).filter(([, v]) => v !== '').map(([k, v]) => [k, String(v)])
        )
      ).toString();

    /* ------------- apply filter ------------- */
    const applyFilter = (e: React.FormEvent) => {
      e.preventDefault();
      router.get(`/report-capaian?${buildQuery()}`, {}, { preserveState: true });
    };

    /* ------------- export ------------- */
    const handleExport = (type: 'excel' | 'pdf' | 'word') => {
      window.location.href = `/report-capaian/export?${buildQuery()}&format=${type}`;
    };

    /* ------------- calculate percentage ------------- */
    const calculatePercentage = (achieved: number, goal: number) => {
      if (goal === 0) return 0;
      return Math.min(100, Math.round((achieved / goal) * 100));
    };

    /* ------------- get period display ------------- */
    const getPeriodDisplay = () => {
      if (scope === 'bulan') {
        const monthNames = [
          'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
          'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        return `${monthNames[Number(filter.bulan) - 1]} ${filter.tahun}`;
      } else if (scope === 'triwulan') {
        return `Triwulan ${filter.triwulan} - ${filter.tahun}`;
      } else {
        return `Tahun ${filter.tahun}`;
      }
    };

    /* ------------- UI ------------- */
    // Definisikan breadcrumbs untuk AppLayout
    const breadcrumbs: BreadcrumbItem[] = [
      { title: 'Laporan Capaian', href: '/report-capaian' }
    ];

    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <Head title="Laporan Capaian" />
        <div 
          className="flex h-full flex-1 flex-col gap-4 rounded-xl p-6 overflow-x-auto"
          style={{
            backgroundImage: `url(${patternBg})`
          }}
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
            <div>
              <h1 className="text-3xl font-bold text-[#E62F2A]">Laporan Capaian</h1>
              <p className="text-gray-500 mt-1">
                Periode: {getPeriodDisplay()}
              </p>
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-2 border border-green-600 bg-white text-green-600 hover:bg-green-50 px-4 py-2 rounded-md transition-colors"
              >
                <FileSpreadsheetIcon size={18} />
                Export Laporan
              </button>
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                  <div className="py-1">
                    <button
                      onClick={() => handleExport('excel')}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <FileSpreadsheetIcon size={16} className="text-green-600" />
                      Export Excel
                    </button>
                    <button
                      onClick={() => handleExport('pdf')}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <FileTextIcon size={16} className="text-red-600" />
                      Export PDF (A4)
                    </button>
                    <button
                      onClick={() => handleExport('word')}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <FileIcon size={16} className="text-blue-600" />
                      Export Word (A4)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Filter Card */}
          <div className="bg-white rounded-xl border shadow-sm">
            <div className="p-4 border-b">
              <div className="flex items-center mb-1">
                <FilterIcon size={18} className="mr-2 text-[#E62F2A]" />
                <h2 className="text-lg font-semibold">Filter Laporan</h2>
              </div>
              <p className="text-sm text-gray-500">
                Pilih periode waktu untuk melihat laporan capaian
              </p>
            </div>
            <div className="p-4">
              <form onSubmit={applyFilter} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Tipe Laporan</label>
                    <select
                      value={scope}
                      onChange={(e) => {
                        const val = e.target.value as 'tahun' | 'bulan' | 'triwulan';
                        setScope(val);
                        setFilter((f) => ({
                          ...f,
                          bulan: val === 'bulan' ? f.bulan : '',
                          triwulan: val === 'triwulan' ? f.triwulan : '',
                        }));
                      }}
                      className="w-full border rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#E62F2A] focus:border-[#E62F2A]"
                    >
                      <option value="tahun">Laporan Tahunan</option>
                      <option value="bulan">Laporan Bulanan</option>
                      <option value="triwulan">Laporan Triwulan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Tahun</label>
                    <input
                      type="number"
                      name="tahun"
                      className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#E62F2A] focus:border-[#E62F2A]"
                      value={filter.tahun}
                      onChange={(e) =>
                        setFilter({ ...filter, tahun: Number(e.target.value) })
                      }
                    />
                  </div>

                  {scope === 'bulan' && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Bulan</label>
                      <select
                        className="w-full border rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#E62F2A] focus:border-[#E62F2A]"
                        value={filter.bulan}
                        onChange={(e) => setFilter({ ...filter, bulan: e.target.value })}
                      >
                        <option value="">Pilih Bulan</option>
                        <option value="1">Januari</option>
                        <option value="2">Februari</option>
                        <option value="3">Maret</option>
                        <option value="4">April</option>
                        <option value="5">Mei</option>
                        <option value="6">Juni</option>
                        <option value="7">Juli</option>
                        <option value="8">Agustus</option>
                        <option value="9">September</option>
                        <option value="10">Oktober</option>
                        <option value="11">November</option>
                        <option value="12">Desember</option>
                      </select>
                    </div>
                  )}

                  {scope === 'triwulan' && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Triwulan</label>
                      <select
                        className="w-full border rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#E62F2A] focus:border-[#E62F2A]"
                        value={filter.triwulan}
                        onChange={(e) =>
                          setFilter({ ...filter, triwulan: e.target.value })
                        }
                      >
                        <option value="">Pilih Triwulan</option>
                        <option value="1">Triwulan 1</option>
                        <option value="2">Triwulan 2</option>
                        <option value="3">Triwulan 3</option>
                        <option value="4">Triwulan 4</option>
                      </select>
                    </div>
                  )}
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-[#E62F2A] hover:bg-[#d12a26] text-white px-4 py-2 rounded-md transition-colors"
                  >
                    Terapkan Filter
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Tabel Hasil */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Hasil Capaian Indikator</h2>
              <p className="text-sm text-gray-500">Perbandingan antara target dan capaian untuk setiap indikator</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border-b border-r px-4 py-3 text-center font-medium text-gray-600">Indikator</th>
                    <th className="border-b border-r px-4 py-3 text-center font-medium text-gray-600">Target</th>
                    <th className="border-b border-r px-4 py-3 text-center font-medium text-gray-600">Capaian</th>
                    <th className="border-b border-r px-4 py-3 text-center font-medium text-gray-600">Persentase</th>
                    <th className="border-b px-4 py-3 text-center font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(indikatorLabels).map((key) => {
                    const targetValue = target[key] ?? 0;
                    const achievedValue = capaian[key] ?? 0;
                    const percentage = calculatePercentage(achievedValue, targetValue);
                    
                    return (
                      <tr key={key} className="hover:bg-gray-50">
                        <td className="border-b border-r px-4 py-3">{indikatorLabels[key]}</td>
                        <td className="border-b border-r px-4 py-3 text-right">
                          {key === 'dana_eksternal' 
                            ? new Intl.NumberFormat('id-ID', { 
                                style: 'currency', 
                                currency: 'IDR',
                                maximumFractionDigits: 0 
                              }).format(targetValue)
                            : targetValue}
                        </td>
                        <td className="border-b border-r px-4 py-3 text-right">
                          {key === 'dana_eksternal' 
                            ? new Intl.NumberFormat('id-ID', { 
                                style: 'currency', 
                                currency: 'IDR',
                                maximumFractionDigits: 0 
                              }).format(achievedValue)
                            : achievedValue}
                        </td>
                        <td className="border-b border-r px-4 py-3 text-right">
                          <div className="flex flex-col space-y-1">
                            <div className="text-sm font-medium">
                              {percentage}%
                              {percentage >= 100 ? 
                                <span className="inline-block ml-1.5 text-green-600">
                                  <TrendingUpIcon size={14} className="inline" />
                                </span> : 
                                <span className="inline-block ml-1.5 text-red-600">
                                  <TrendingDownIcon size={14} className="inline" />
                                </span>
                              }
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                              <div 
                                className={`h-full ${
                                  percentage >= 100 
                                    ? "bg-green-500" 
                                    : percentage >= 75 
                                      ? "bg-yellow-500" 
                                      : "bg-red-500"
                                }`} 
                                style={{ width: `${Math.min(100, percentage)}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="border-b px-4 py-3 text-center">
                          <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-medium ${
                            percentage >= 100 
                              ? "bg-green-100 text-green-800" 
                              : percentage >= 75 
                                ? "bg-yellow-100 text-yellow-800" 
                                : "bg-red-100 text-red-800"
                          }`}>
                            {percentage >= 100 ? "Tercapai" : percentage >= 75 ? "Hampir Tercapai" : "Belum Tercapai"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t bg-gray-50 text-sm text-gray-500 flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <div>
                Menampilkan {Object.keys(indikatorLabels).length} indikator kinerja
              </div>
              <div className="mt-2 sm:mt-0">
                Terakhir diperbaharui: {new Date().toLocaleDateString('id-ID', {
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric'
                })}
              </div>
            </div>
          </div>
          

        </div>
      </AppLayout>
    );
  }
