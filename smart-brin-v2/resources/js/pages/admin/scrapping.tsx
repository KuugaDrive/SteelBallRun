import React, { FormEvent, useMemo, useState } from 'react';


import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { toast } from 'sonner';


type OrganisasiRiset = {
    id: string;
    organisasi_riset: string;
};

type PusatRiset = {
    id: string;
    organisasi_riset_id: string | null;
    kode_unit: string;
    nama_unit: string;
};

type KelompokRiset = {
    id: string;
    unit_kerja_id: string;
    kelompok_riset: string;
};

type ScrapeUser = {
    id: string;
    name: string;
    email: string;
    unit_kerja_id: string | null;
    research_group: string | null;
    google_scholar_id: string | null;
};

type PageProps = {
    organisasiRisets: OrganisasiRiset[];
    pusatRisets: PusatRiset[];
    kelompokRisets: KelompokRiset[];
    users: ScrapeUser[];
    yearOptions: number[];
    scimagoCsv: {
        source: 'uploaded' | 'env' | 'none';
        path: string | null;
        filename: string | null;
        last_modified: string | null;
    };
};

type ExtractionResult = {
    id: string;
    raw_title: string;
    title: string | null;
    raw_authors: string | null;
    pub_type: string | null;
    ai_core_focus: string | null;
    publication_year: number | null;
    publisher: string | null;
    doi: string | null;
    issn: string | null;
    quartile: string | null;
    scholar_link: string | null;
    status_mapping: string;
};

const getFirstValidationError = (errors?: Record<string, string[]>): string | undefined => {
    if (!errors) {
        return undefined;
    }

    const firstEntry = Object.values(errors)[0];
    return firstEntry?.[0];
};

export default function ScrappingPage() {
    const getCookie = (name: string): string | null => {
        const cookies = document.cookie ? document.cookie.split('; ') : [];
        const target = cookies.find((row) => row.startsWith(`${name}=`));
        if (!target) {
            return null;
        }
        return target.substring(name.length + 1);
    };

    const getCsrfHeaders = (): Record<string, string> | null => {
        const xsrfToken = getCookie('XSRF-TOKEN');
        const metaToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';

        if (xsrfToken) {
            return {
                'X-XSRF-TOKEN': decodeURIComponent(xsrfToken),
            };
        }

        if (metaToken) {
            return {
                'X-CSRF-TOKEN': metaToken,
            };
        }

        return null;
    };

    const breadcrumbs: BreadcrumbItem[] = [{ title: 'Scrapping Publikasi', href: '/admin/scrapping' }];
    const { organisasiRisets, pusatRisets, kelompokRisets, users, yearOptions, scimagoCsv } = usePage<PageProps>().props;

    const [organisasiText, setOrganisasiText] = useState('');
    const [organisasiId, setOrganisasiId] = useState('');
    const [pusatRisetText, setPusatRisetText] = useState('');
    const [pusatRisetId, setPusatRisetId] = useState('');
    const [kelompokText, setKelompokText] = useState('');
    const [kelompokId, setKelompokId] = useState('');
    const [userText, setUserText] = useState('');
    const [userId, setUserId] = useState('');
    const [selectedYear, setSelectedYear] = useState<number>(yearOptions[0] ?? new Date().getFullYear());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isManualSavingId, setIsManualSavingId] = useState<string | null>(null);
    const [isBackfillingCoreFocus, setIsBackfillingCoreFocus] = useState(false);
    const [activeScimagoCsv, setActiveScimagoCsv] = useState(scimagoCsv);
    const [selectedScimagoFile, setSelectedScimagoFile] = useState<File | null>(null);
    const [isUploadingScimagoCsv, setIsUploadingScimagoCsv] = useState(false);
    const [isDeletingScimagoCsv, setIsDeletingScimagoCsv] = useState(false);
    const [isReplacingScimagoCsv, setIsReplacingScimagoCsv] = useState(false);

    // State baru untuk proses mapping
    const [isMapping, setIsMapping] = useState(false);

    const [extractionResults, setExtractionResults] = useState<ExtractionResult[]>([]);
    const [manualPubTypeById, setManualPubTypeById] = useState<Record<string, string>>({});

    const pubTypeOptions = ['Conference Paper', 'Journal Article', 'Book', 'Book Chapter'];

    const filteredPusatRisets = useMemo(
        () => pusatRisets.filter((item) => item.organisasi_riset_id === organisasiId),
        [pusatRisets, organisasiId],
    );

    const filteredKelompoks = useMemo(
        () => kelompokRisets.filter((item) => item.unit_kerja_id === pusatRisetId),
        [kelompokRisets, pusatRisetId],
    );

    const filteredUsers = useMemo(() => {
        return users.filter((item) => {
            if (!item.unit_kerja_id || item.unit_kerja_id !== pusatRisetId) {
                return false;
            }

            if (!item.research_group) {
                return false;
            }

            return item.research_group === kelompokId;
        });
    }, [users, pusatRisetId, kelompokId]);

    const handleOrganisasiChange = (value: string) => {
        const selected = organisasiRisets.find((item) => item.organisasi_riset === value);
        setOrganisasiText(value);
        setOrganisasiId(selected?.id ?? '');

        setPusatRisetText('');
        setPusatRisetId('');
        setKelompokText('');
        setKelompokId('');
        setUserText('');
        setUserId('');
    };

    const handlePusatRisetChange = (value: string) => {
        const selected = filteredPusatRisets.find((item) => item.nama_unit === value);
        setPusatRisetText(value);
        setPusatRisetId(selected?.id ?? '');

        setKelompokText('');
        setKelompokId('');
        setUserText('');
        setUserId('');
    };

    const handleKelompokChange = (value: string) => {
        const selected = filteredKelompoks.find((item) => item.kelompok_riset === value);
        setKelompokText(value);
        setKelompokId(selected?.id ?? '');

        setUserText('');
        setUserId('');
    };

    const handleUserChange = (value: string) => {
        const selected = filteredUsers.find((item) => item.name === value);
        setUserText(value);
        setUserId(selected?.id ?? '');
    };

    const fetchResultsByCriteria = async (): Promise<ExtractionResult[]> => {
        if (!organisasiId || !pusatRisetId || !kelompokId || !userId) {
            return [];
        }

        const csrfHeaders = getCsrfHeaders();
        if (!csrfHeaders) {
            return [];
        }

        const response = await fetch(route('admin.scrapping.results', undefined, false), {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                ...csrfHeaders,
            },
            body: JSON.stringify({
                organisasi_riset_id: organisasiId,
                pusat_riset_id: pusatRisetId,
                kelompok_riset_id: kelompokId,
                user_id: userId,
                year: selectedYear,
            }),
        });

        const payload = (await response.json()) as {
            message?: string;
            extractions?: ExtractionResult[];
            errors?: Record<string, string[]>;
        };

        if (!response.ok) {
            const firstError = payload.errors ? Object.values(payload.errors)[0]?.[0] : undefined;
            throw new Error(firstError ?? payload.message ?? 'Gagal mengambil data hasil scraping.');
        }

        return payload.extractions ?? [];
    };

    const submitScraping = async (event: FormEvent) => {
        event.preventDefault();

        if (!organisasiId || !pusatRisetId || !kelompokId || !userId) {
            toast.error('Lengkapi seluruh pilihan autocomplete sebelum memulai scraping.');
            return;
        }

        const csrfHeaders = getCsrfHeaders();
        if (!csrfHeaders) {
            toast.error('CSRF token tidak ditemukan. Refresh halaman lalu coba lagi.');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(route('admin.scrapping.start', undefined, false), {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...csrfHeaders,
                },
                body: JSON.stringify({
                    organisasi_riset_id: organisasiId,
                    pusat_riset_id: pusatRisetId,
                    kelompok_riset_id: kelompokId,
                    user_id: userId,
                    year: selectedYear,
                }),
            });

            const payloadText = await response.text();
            let payload: {
                message?: string;
                processed?: number;
                inserted?: number;
                updated?: number;
                skipped?: number;
                extractions?: ExtractionResult[];
                errors?: Record<string, string[]>;
            } = {};

            if (payloadText.trim() !== '') {
                try {
                    payload = JSON.parse(payloadText) as typeof payload;
                } catch {
                    payload = { message: payloadText.slice(0, 300) };
                }
            }

            if (!response.ok) {
                if (payload.errors) {
                    const firstError = getFirstValidationError(payload.errors);
                    toast.error(firstError ?? payload.message ?? 'Proses scraping gagal.');
                } else {
                    toast.error(payload.message ?? `Proses scraping gagal (HTTP ${response.status}).`);
                }
                return;
            }

            toast.success(
                `${payload.message ?? 'Scraping selesai.'} Processed: ${payload.processed ?? 0}, inserted: ${payload.inserted ?? 0}, updated: ${payload.updated ?? 0}, skipped: ${payload.skipped ?? 0}.`,
            );

            try {
                const filteredResults = await fetchResultsByCriteria();
                if (filteredResults.length > 0) {
                    setExtractionResults(filteredResults);
                } else {
                    setExtractionResults(payload.extractions ?? []);
                }
            } catch {
                setExtractionResults(payload.extractions ?? []);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Terjadi kesalahan saat menghubungi server.';
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const saveManualPubType = async (extractionId: string) => {
        const selectedPubType = manualPubTypeById[extractionId];
        if (!selectedPubType) {
            toast.error('Pilih pub type terlebih dahulu.');
            return;
        }

        const csrfHeaders = getCsrfHeaders();
        if (!csrfHeaders) {
            toast.error('CSRF token tidak ditemukan. Refresh halaman lalu coba lagi.');
            return;
        }

        setIsManualSavingId(extractionId);

        try {
            const response = await fetch(route('admin.scrapping.manual-reclassify-pub-type', undefined, false), {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...csrfHeaders,
                },
                body: JSON.stringify({
                    extraction_id: extractionId,
                    pub_type: selectedPubType,
                }),
            });

            const payload = (await response.json()) as {
                message?: string;
                extraction?: { id: string; pub_type: string };
                errors?: Record<string, string[]>;
            };

            if (!response.ok) {
                if (payload.errors) {
                    const firstError = getFirstValidationError(payload.errors);
                    toast.error(firstError ?? payload.message ?? 'Simpan pub type manual gagal.');
                } else {
                    toast.error(payload.message ?? 'Simpan pub type manual gagal.');
                }
                return;
            }

            setExtractionResults((prev) =>
                prev.map((item) =>
                    item.id === extractionId ? { ...item, pub_type: payload.extraction?.pub_type ?? selectedPubType } : item,
                ),
            );
            toast.success(payload.message ?? 'Pub type berhasil diperbarui.');
        } catch {
            toast.error('Terjadi kesalahan saat menghubungi server.');
        } finally {
            setIsManualSavingId(null);
        }
    };

    const backfillAiCoreFocus = async () => {
        if (!organisasiId || !pusatRisetId || !kelompokId || !userId) {
            toast.error('Lengkapi seluruh pilihan autocomplete sebelum backfill ai_core_focus.');
            return;
        }

        const csrfHeaders = getCsrfHeaders();
        if (!csrfHeaders) {
            toast.error('CSRF token tidak ditemukan. Refresh halaman lalu coba lagi.');
            return;
        }

        setIsBackfillingCoreFocus(true);

        try {
            const response = await fetch(route('admin.scrapping.backfill-ai-core-focus', undefined, false), {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...csrfHeaders,
                },
                body: JSON.stringify({
                    organisasi_riset_id: organisasiId,
                    pusat_riset_id: pusatRisetId,
                    kelompok_riset_id: kelompokId,
                    user_id: userId,
                    year: selectedYear,
                }),
            });

            const payload = (await response.json()) as {
                message?: string;
                processed?: number;
                updated?: number;
                skipped?: number;
                extractions?: ExtractionResult[];
                errors?: Record<string, string[]>;
            };

            if (!response.ok) {
                if (payload.errors) {
                    const firstError = getFirstValidationError(payload.errors);
                    toast.error(firstError ?? payload.message ?? 'Backfill ai_core_focus gagal.');
                } else {
                    toast.error(payload.message ?? 'Backfill ai_core_focus gagal.');
                }
                return;
            }

            setExtractionResults(payload.extractions ?? []);
            toast.success(
                `${payload.message ?? 'Backfill ai_core_focus selesai.'} Processed: ${payload.processed ?? 0}, updated: ${payload.updated ?? 0}, skipped: ${payload.skipped ?? 0}.`,
            );
        } catch {
            toast.error('Terjadi kesalahan saat menghubungi server.');
        } finally {
            setIsBackfillingCoreFocus(false);
        }
    };

    // Fungsi baru untuk mapping ke Tabel Publikasi
    const mapToPublication = async () => {
        if (!userId) {
            toast.error('Pilih user terlebih dahulu sebelum melakukan mapping.');
            return;
        }

        const csrfHeaders = getCsrfHeaders();
        if (!csrfHeaders) {
            toast.error('CSRF token tidak ditemukan. Refresh halaman lalu coba lagi.');
            return;
        }

        setIsMapping(true);

        try {
            const response = await fetch(route('admin.scrapping.map-data', undefined, false), {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...csrfHeaders,
                },
                body: JSON.stringify({
                    user_id: userId,
                }),
            });

            const payload = await response.json();

            if (!response.ok) {
                const firstError = getFirstValidationError(payload.errors);
                toast.error(firstError ?? payload.message ?? 'Proses mapping gagal.');
                return;
            }

            toast.success(
                `${payload.message ?? 'Mapping selesai.'} (Berhasil: ${payload.hasil?.mapped ?? 0}, Gagal: ${payload.hasil?.failed ?? 0})`
            );

            try {
                const results = await fetchResultsByCriteria();
                setExtractionResults(results);
            } catch {
                // Abaikan jika pemuatan ulang gagal
            }
        } catch {
            toast.error('Terjadi kesalahan saat menghubungi server.');
        } finally {
            setIsMapping(false);
        }
    };

    const uploadScimagoCsv = async () => {
        if (!selectedScimagoFile) {
            toast.error('Pilih file CSV SCImago terlebih dahulu.');
            return;
        }

        const csrfHeaders = getCsrfHeaders();
        if (!csrfHeaders) {
            toast.error('CSRF token tidak ditemukan. Refresh halaman lalu coba lagi.');
            return;
        }

        const formData = new FormData();
        formData.append('csv_file', selectedScimagoFile);

        setIsUploadingScimagoCsv(true);
        try {
            const response = await fetch(route('admin.scrapping.scimago-csv.upload', undefined, false), {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...csrfHeaders,
                },
                body: formData,
            });

            const payload = (await response.json()) as {
                message?: string;
                scimago_csv?: PageProps['scimagoCsv'];
                errors?: Record<string, string[]>;
            };

            if (!response.ok) {
                const firstError = getFirstValidationError(payload.errors);
                toast.error(firstError ?? payload.message ?? 'Upload CSV SCImago gagal.');
                return;
            }

            setActiveScimagoCsv(payload.scimago_csv ?? activeScimagoCsv);
            setSelectedScimagoFile(null);
            setIsReplacingScimagoCsv(false);
            toast.success(payload.message ?? 'CSV SCImago berhasil diunggah.');
        } catch {
            toast.error('Terjadi kesalahan saat mengunggah CSV SCImago.');
        } finally {
            setIsUploadingScimagoCsv(false);
        }
    };

    const deleteScimagoCsv = async () => {
        const csrfHeaders = getCsrfHeaders();
        if (!csrfHeaders) {
            toast.error('CSRF token tidak ditemukan. Refresh halaman lalu coba lagi.');
            return;
        }

        setIsDeletingScimagoCsv(true);
        try {
            const response = await fetch(route('admin.scrapping.scimago-csv.delete', undefined, false), {
                method: 'DELETE',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...csrfHeaders,
                },
            });

            const payload = (await response.json()) as {
                message?: string;
                scimago_csv?: PageProps['scimagoCsv'];
            };

            if (!response.ok) {
                toast.error(payload.message ?? 'Hapus CSV SCImago gagal.');
                return;
            }

            setActiveScimagoCsv(payload.scimago_csv ?? activeScimagoCsv);
            setSelectedScimagoFile(null);
            setIsReplacingScimagoCsv(false);
            toast.success(payload.message ?? 'CSV SCImago upload berhasil dihapus.');
        } catch {
            toast.error('Terjadi kesalahan saat menghapus CSV SCImago.');
        } finally {
            setIsDeletingScimagoCsv(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Scrapping Publikasi" />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#E62F2A]">Scrapping Publikasi</h1>
                    <p className="text-sm text-neutral-600">
                        Khusus superadmin: pilih organisasi riset, pusat riset, kelompok riset, user, dan tahun untuk menjalankan scraping Google Scholar.
                    </p>
                </div>

                <section className="rounded-xl border bg-white p-4 shadow">
                    <div className="mb-3">
                        <h2 className="text-lg font-semibold">Rujukan SCImago (Global)</h2>
                        <p className="text-xs text-neutral-500">
                            Upload CSV SCImago dilakukan satu kali sebagai referensi kuartil global. Jika sudah ada file upload, gunakan tombol Ubah atau Hapus.
                        </p>
                    </div>
                    {activeScimagoCsv.source === 'uploaded' && !isReplacingScimagoCsv ? (
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                className="rounded-md border border-[#E62F2A] px-4 py-2 text-[#E62F2A] hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                onClick={() => {
                                    setIsReplacingScimagoCsv(true);
                                    setSelectedScimagoFile(null);
                                }}
                                disabled={isUploadingScimagoCsv || isDeletingScimagoCsv}
                            >
                                Ubah CSV
                            </button>
                            <button
                                type="button"
                                className="rounded-md border border-red-600 px-4 py-2 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                onClick={deleteScimagoCsv}
                                disabled={isUploadingScimagoCsv || isDeletingScimagoCsv}
                            >
                                {isDeletingScimagoCsv ? 'Menghapus...' : 'Hapus CSV Upload'}
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
                            <div>
                                <label className="mb-1 block text-sm font-medium">
                                    {activeScimagoCsv.source === 'uploaded' ? 'Ganti File CSV SCImago' : 'File CSV SCImago'}
                                </label>
                                <input
                                    type="file"
                                    accept=".csv,text/csv"
                                    className="block w-full rounded-md border px-3 py-2 text-sm"
                                    onChange={(event) => setSelectedScimagoFile(event.target.files?.[0] ?? null)}
                                    disabled={isUploadingScimagoCsv || isDeletingScimagoCsv}
                                />
                            </div>
                            <button
                                type="button"
                                className="rounded-md bg-[#E62F2A] px-4 py-2 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                                onClick={uploadScimagoCsv}
                                disabled={!selectedScimagoFile || isUploadingScimagoCsv || isDeletingScimagoCsv}
                            >
                                {isUploadingScimagoCsv
                                    ? 'Mengunggah...'
                                    : activeScimagoCsv.source === 'uploaded'
                                      ? 'Simpan Perubahan'
                                      : 'Upload CSV'}
                            </button>
                            {activeScimagoCsv.source === 'uploaded' ? (
                                <button
                                    type="button"
                                    className="rounded-md border border-neutral-400 px-4 py-2 text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    onClick={() => {
                                        setIsReplacingScimagoCsv(false);
                                        setSelectedScimagoFile(null);
                                    }}
                                    disabled={isUploadingScimagoCsv || isDeletingScimagoCsv}
                                >
                                    Batal
                                </button>
                            ) : (
                                <div />
                            )}
                        </div>
                    )}
                    <div className="mt-3 rounded-md bg-neutral-50 p-3 text-xs text-neutral-700">
                        <p>
                            <span className="font-semibold">Sumber aktif:</span>{' '}
                            {activeScimagoCsv.source === 'uploaded'
                                ? 'Upload Superadmin'
                                : activeScimagoCsv.source === 'env'
                                  ? 'Path dari .env'
                                  : 'Belum ada'}
                        </p>
                        <p>
                            <span className="font-semibold">File:</span> {activeScimagoCsv.filename ?? '-'}
                        </p>
                        <p>
                            <span className="font-semibold">Terakhir diubah:</span> {activeScimagoCsv.last_modified ?? '-'}
                        </p>
                    </div>
                </section>

                <section className="rounded-xl border bg-white p-4 shadow">
                    <form onSubmit={submitScraping} className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Organisasi Riset</label>
                            <input
                                className="h-10 w-full rounded-md border px-3"
                                list="organisasi-riset-list"
                                value={organisasiText}
                                onChange={(event) => handleOrganisasiChange(event.target.value)}
                                placeholder="Cari organisasi riset..."
                                required
                            />
                            <datalist id="organisasi-riset-list">
                                {organisasiRisets.map((item) => (
                                    <option key={item.id} value={item.organisasi_riset} />
                                ))}
                            </datalist>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium">Pusat Riset</label>
                            <input
                                className="h-10 w-full rounded-md border px-3"
                                list="pusat-riset-list"
                                value={pusatRisetText}
                                onChange={(event) => handlePusatRisetChange(event.target.value)}
                                placeholder="Cari pusat riset..."
                                disabled={!organisasiId}
                                required
                            />
                            <datalist id="pusat-riset-list">
                                {filteredPusatRisets.map((item) => (
                                    <option key={item.id} value={item.nama_unit} />
                                ))}
                            </datalist>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium">Kelompok Riset</label>
                            <input
                                className="h-10 w-full rounded-md border px-3"
                                list="kelompok-riset-list"
                                value={kelompokText}
                                onChange={(event) => handleKelompokChange(event.target.value)}
                                placeholder="Cari kelompok riset..."
                                disabled={!pusatRisetId}
                                required
                            />
                            <datalist id="kelompok-riset-list">
                                {filteredKelompoks.map((item) => (
                                    <option key={item.id} value={item.kelompok_riset} />
                                ))}
                            </datalist>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium">User (Sivitas)</label>
                            <input
                                className="h-10 w-full rounded-md border px-3"
                                list="user-list"
                                value={userText}
                                onChange={(event) => handleUserChange(event.target.value)}
                                placeholder="Cari user..."
                                disabled={!kelompokId}
                                required
                            />
                            <datalist id="user-list">
                                {filteredUsers.map((item) => (
                                    <option key={item.id} value={item.name} />
                                ))}
                            </datalist>
                            {userId && (
                                <p className="text-xs text-neutral-500">
                                    Scholar ID: {filteredUsers.find((item) => item.id === userId)?.google_scholar_id || 'Belum diisi'}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium">Tahun</label>
                            <select
                                className="h-10 w-full rounded-md border px-3"
                                value={selectedYear}
                                onChange={(event) => setSelectedYear(Number(event.target.value))}
                            >
                                {yearOptions.map((year) => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="submit"
                                    className="rounded-md bg-[#E62F2A] px-4 py-2 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                                    disabled={isSubmitting || isMapping}
                                >
                                    {isSubmitting ? 'Memproses scraping...' : 'Mulai Scrapping'}
                                </button>
                                <button
                                    type="button"
                                    className="rounded-md border border-[#E62F2A] px-4 py-2 text-[#E62F2A] hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    disabled={isSubmitting || isMapping || !organisasiId || !pusatRisetId || !kelompokId || !userId}
                                    onClick={async () => {
                                        try {
                                            const results = await fetchResultsByCriteria();
                                            setExtractionResults(results);
                                        } catch (error) {
                                            const message = error instanceof Error ? error.message : 'Gagal mengambil hasil scraping.';
                                            toast.error(message);
                                        }
                                    }}
                                >
                                    Tampilkan Hasil
                                </button>
                            </div>
                        </div>
                    </form>
                </section>

                <section className="rounded-xl border bg-white p-4 shadow">
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                        <div>
                            <h2 className="text-lg font-semibold">Hasil Document Extractions</h2>
                            <p className="text-xs text-neutral-500">Ditampilkan berdasarkan kriteria yang dipilih pada proses scraping terakhir.</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                className="rounded-md border border-emerald-700 px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                                disabled={isSubmitting || isBackfillingCoreFocus || isMapping || !organisasiId || !pusatRisetId || !kelompokId || !userId}
                                onClick={backfillAiCoreFocus}
                            >
                                {isBackfillingCoreFocus ? 'Memproses backfill...' : 'Backfill AI Core Focus'}
                            </button>

                            {/* TOMBOL SIMPAN KE TABEL PUBLIKASI */}
                            <button
                                type="button"
                                className="rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                disabled={isSubmitting || isBackfillingCoreFocus || isMapping || !userId}
                                onClick={mapToPublication}
                            >
                                {isMapping ? 'Menyimpan...' : 'Simpan ke Tabel Publikasi'}
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse text-sm">
                            <thead>
                                <tr className="border-b bg-neutral-50 text-left">
                                    <th className="px-3 py-2">Judul</th>
                                    <th className="px-3 py-2">Penulis</th>
                                    <th className="px-3 py-2">Tipe</th>
                                    <th className="px-3 py-2">Fokus</th>
                                    <th className="px-3 py-2">Tahun</th>
                                    <th className="px-3 py-2">Publisher</th>
                                    <th className="px-3 py-2">DOI</th>
                                    <th className="px-3 py-2">ISSN</th>
                                    <th className="px-3 py-2">Kuartil</th>
                                    <th className="px-3 py-2">Status</th>
                                    <th className="px-3 py-2">Link</th>
                                    <th className="px-3 py-2">Manual Reclassify</th>
                                </tr>
                            </thead>
                            <tbody>
                                {extractionResults.length === 0 ? (
                                    <tr>
                                        <td className="px-3 py-3 text-neutral-500" colSpan={12}>
                                            Belum ada hasil untuk ditampilkan.
                                        </td>
                                    </tr>
                                ) : (
                                    extractionResults.map((item) => (
                                        <tr key={item.id} className="border-b align-top">
                                            <td className="px-3 py-2">{item.raw_title}</td>
                                            <td className="px-3 py-2">{item.raw_authors ?? '-'}</td>
                                            <td className="px-3 py-2">{item.pub_type ?? '-'}</td>
                                            <td className="px-3 py-2">{item.ai_core_focus ?? '-'}</td>
                                            <td className="px-3 py-2">{item.publication_year ?? '-'}</td>
                                            <td className="px-3 py-2">{item.publisher ?? '-'}</td>
                                            <td className="px-3 py-2">
                                                {item.doi ? (
                                                    <a
                                                        href={`https://doi.org/${item.doi}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-[#E62F2A] underline"
                                                    >
                                                        {item.doi}
                                                    </a>
                                                ) : (
                                                    '-'
                                                )}
                                            </td>
                                            <td className="px-3 py-2">{item.issn ?? '-'}</td>
                                            <td className="px-3 py-2">{item.quartile ?? '-'}</td>
                                            <td className="px-3 py-2">
                                                <span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${item.status_mapping === 'mapped' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                                    {item.status_mapping}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2">
                                                {item.scholar_link ? (
                                                    <a
                                                        href={item.scholar_link}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-[#E62F2A] underline"
                                                    >
                                                        Buka
                                                    </a>
                                                ) : (
                                                    '-'
                                                )}
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="flex min-w-[220px] items-center gap-2">
                                                    <select
                                                        className="h-9 w-full rounded border px-2"
                                                        value={manualPubTypeById[item.id] ?? item.pub_type ?? 'Journal Article'}
                                                        onChange={(event) =>
                                                            setManualPubTypeById((prev) => ({
                                                                ...prev,
                                                                [item.id]: event.target.value,
                                                            }))
                                                        }
                                                        disabled={isManualSavingId === item.id || item.status_mapping === 'mapped'}
                                                    >
                                                        {pubTypeOptions.map((option) => (
                                                            <option key={option} value={option}>
                                                                {option}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        type="button"
                                                        className="rounded border border-blue-600 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                                                        onClick={() => saveManualPubType(item.id)}
                                                        disabled={isManualSavingId === item.id || item.status_mapping === 'mapped'}
                                                    >
                                                        {isManualSavingId === item.id ? 'Menyimpan...' : 'Simpan'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
