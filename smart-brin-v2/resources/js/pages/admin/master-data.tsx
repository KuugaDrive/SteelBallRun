import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import patternBg from '../../assets/bg-pattern3.png';
import UserAccountTable, { KelompokRisetOption, UnitKerjaOption, User } from '@/components/AccountManagement/UserAccountTable';

type OrganisasiRiset = {
    id: string;
    organisasi_riset: string;
};

type UnitKerja = {
    id: string;
    organisasi_riset_id: string | null;
    kode_unit: string;
    nama_unit: string;
    kelompok_riset: string;
    level: 'Settama' | 'Deputi' | 'Inspektorat' | 'Organisasi Riset' | 'Pusat Riset';
    organisasi_riset?: OrganisasiRiset | null;
};

type KelompokRiset = {
    id: string;
    unit_kerja_id: string;
    kelompok_riset: string;
    unit_kerja?: UnitKerja | null;
};

type PageProps = {
    auth: {
        user: {
            role?: 'head' | 'researcher' | 'monev' | 'admin' | 'superadmin';
        } | null;
    };
    users: User[];
    unitKerjaOptions: UnitKerjaOption[];
    kelompokRisetOptions: KelompokRisetOption[];
    organisasiRisets: OrganisasiRiset[];
    units: UnitKerja[];
    kelompokRisets: KelompokRiset[];
};

const levels: UnitKerja['level'][] = ['Settama', 'Deputi', 'Inspektorat', 'Organisasi Riset', 'Pusat Riset'];

export default function AdminMasterData() {
    const breadcrumbs: BreadcrumbItem[] = [{ title: 'Admin Master Data', href: '/admin/master-data' }];
    const { auth, users, unitKerjaOptions, kelompokRisetOptions, organisasiRisets, units, kelompokRisets } = usePage<PageProps>().props;
    const isSuperAdmin = auth?.user?.role === 'superadmin';

    const [newOrganisasi, setNewOrganisasi] = useState('');
    const [newUnit, setNewUnit] = useState({
        organisasi_riset_id: '',
        kode_unit: '',
        nama_unit: '',
        kelompok_riset: '',
        level: 'Pusat Riset',
    });
    const [newKelompok, setNewKelompok] = useState({
        unit_kerja_id: '',
        unit_kerja_nama: '',
        kelompok_riset: '',
    });
    const [editingUnit, setEditingUnit] = useState<UnitKerja | null>(null);
    const [editingKelompok, setEditingKelompok] = useState<KelompokRiset | null>(null);
    const [editUnitForm, setEditUnitForm] = useState({
        organisasi_riset_id: '',
        kode_unit: '',
        nama_unit: '',
        kelompok_riset: '',
        level: 'Pusat Riset' as UnitKerja['level'],
    });
    const [editKelompokForm, setEditKelompokForm] = useState({
        unit_kerja_id: '',
        unit_kerja_nama: '',
        kelompok_riset: '',
    });
    const [activeTab, setActiveTab] = useState<'user' | 'organisasi' | 'unit' | 'kelompok'>('user');

    const submitOrganisasi = (e: FormEvent) => {
        e.preventDefault();
        router.post(route('admin.master-data.organisasi.store'), { organisasi_riset: newOrganisasi }, { preserveScroll: true });
        setNewOrganisasi('');
    };

    const submitUnit = (e: FormEvent) => {
        e.preventDefault();
        if (!isSuperAdmin) return;

        router.post(
            route('admin.master-data.unit.store'),
            {
                organisasi_riset_id: newUnit.organisasi_riset_id || null,
                kode_unit: newUnit.kode_unit,
                nama_unit: newUnit.nama_unit,
                kelompok_riset: newUnit.kelompok_riset,
                level: newUnit.level,
            },
            { preserveScroll: true },
        );
        setNewUnit({
            organisasi_riset_id: '',
            kode_unit: '',
            nama_unit: '',
            kelompok_riset: '',
            level: 'Pusat Riset',
        });
    };

    const submitKelompok = (e: FormEvent) => {
        e.preventDefault();
        if (!newKelompok.unit_kerja_id) {
            alert('Silakan pilih unit kerja dari daftar autocomplete.');
            return;
        }

        router.post(
            route('admin.master-data.kelompok.store'),
            {
                unit_kerja_id: newKelompok.unit_kerja_id,
                kelompok_riset: newKelompok.kelompok_riset,
            },
            { preserveScroll: true },
        );
        setNewKelompok({ unit_kerja_id: '', unit_kerja_nama: '', kelompok_riset: '' });
    };

    const handleNewKelompokUnitKerjaChange = (value: string) => {
        const selected = units.find((u) => u.nama_unit === value);
        setNewKelompok((prev) => ({
            ...prev,
            unit_kerja_nama: value,
            unit_kerja_id: selected ? String(selected.id) : '',
        }));
    };

    const openEditUnit = (unit: UnitKerja) => {
        if (!isSuperAdmin) return;

        setEditingUnit(unit);
        setEditUnitForm({
            organisasi_riset_id: unit.organisasi_riset_id ?? '',
            kode_unit: unit.kode_unit,
            nama_unit: unit.nama_unit,
            kelompok_riset: unit.kelompok_riset,
            level: unit.level,
        });
    };

    const submitEditUnit = (e: FormEvent) => {
        e.preventDefault();
        if (!editingUnit) return;
        if (!isSuperAdmin) return;

        router.put(
            route('admin.master-data.unit.update', editingUnit.id),
            {
                organisasi_riset_id: editUnitForm.organisasi_riset_id || null,
                kode_unit: editUnitForm.kode_unit,
                nama_unit: editUnitForm.nama_unit,
                kelompok_riset: editUnitForm.kelompok_riset,
                level: editUnitForm.level,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setEditingUnit(null);
                },
            },
        );
    };

    const openEditKelompok = (item: KelompokRiset) => {
        setEditingKelompok(item);
        setEditKelompokForm({
            unit_kerja_id: String(item.unit_kerja_id),
            unit_kerja_nama: item.unit_kerja?.nama_unit ?? '',
            kelompok_riset: item.kelompok_riset,
        });
    };

    const handleEditKelompokUnitKerjaChange = (value: string) => {
        const selected = units.find((u) => u.nama_unit === value);
        setEditKelompokForm((prev) => ({
            ...prev,
            unit_kerja_nama: value,
            unit_kerja_id: selected ? String(selected.id) : '',
        }));
    };

    const submitEditKelompok = (e: FormEvent) => {
        e.preventDefault();
        if (!editingKelompok) return;
        if (!editKelompokForm.unit_kerja_id) {
            alert('Silakan pilih unit kerja dari daftar autocomplete.');
            return;
        }

        router.put(
            route('admin.master-data.kelompok.update', editingKelompok.id),
            {
                unit_kerja_id: editKelompokForm.unit_kerja_id,
                kelompok_riset: editKelompokForm.kelompok_riset,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setEditingKelompok(null);
                },
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Master Data" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-6" style={{ backgroundImage: `url(${patternBg})` }}>
                <div>
                    <h1 className="text-4xl font-extrabold text-[#E62F2A]">Admin Master Data</h1>
                    <p className="text-md text-neutral-500">CRUD tabel master untuk organisasi, unit kerja, dan kelompok riset.</p>
                </div>

                <div className="flex flex-wrap gap-2 rounded-xl border bg-white p-3 shadow-lg">
                    <button
                        type="button"
                        className={`rounded-md px-4 py-2 text-sm font-semibold ${activeTab === 'user' ? 'bg-[#E62F2A] text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}`}
                        onClick={() => setActiveTab('user')}
                    >
                        User
                    </button>
                    <button
                        type="button"
                        className={`rounded-md px-4 py-2 text-sm font-semibold ${activeTab === 'organisasi' ? 'bg-[#E62F2A] text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}`}
                        onClick={() => setActiveTab('organisasi')}
                    >
                        Organisasi Riset
                    </button>
                    <button
                        type="button"
                        className={`rounded-md px-4 py-2 text-sm font-semibold ${activeTab === 'unit' ? 'bg-[#E62F2A] text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}`}
                        onClick={() => setActiveTab('unit')}
                    >
                        Unit Kerja
                    </button>
                    <button
                        type="button"
                        className={`rounded-md px-4 py-2 text-sm font-semibold ${activeTab === 'kelompok' ? 'bg-[#E62F2A] text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}`}
                        onClick={() => setActiveTab('kelompok')}
                    >
                        Kelompok Riset
                    </button>
                </div>

                {activeTab === 'user' && (
                <section className="rounded-xl border bg-white p-4 shadow-lg">
                    <h2 className="mb-3 text-xl font-bold">User</h2>
                    <p className="mb-4 text-sm text-neutral-500">Kelola user, role, dan unit kerja.</p>
                    <UserAccountTable data={users} unitKerjaOptions={unitKerjaOptions} kelompokRisetOptions={kelompokRisetOptions} />
                </section>
                )}

                {activeTab === 'organisasi' && (
                <section className="rounded-xl border bg-white p-4 shadow-lg">
                    <h2 className="mb-3 text-xl font-bold">Organisasi Riset</h2>
                    <form onSubmit={submitOrganisasi} className="mb-4 flex gap-2">
                        <input
                            className="h-10 w-full rounded-md border px-3"
                            value={newOrganisasi}
                            onChange={(e) => setNewOrganisasi(e.target.value)}
                            placeholder="Nama organisasi riset"
                            required
                        />
                        <button className="rounded-md bg-[#E62F2A] px-4 text-white hover:bg-red-700">Tambah</button>
                    </form>
                    <table className="w-full border text-sm">
                        <thead className="bg-[#E62F2A] text-white">
                            <tr>
                                <th className="border px-3 py-2 text-left">ID</th>
                                <th className="border px-3 py-2 text-left">Organisasi Riset</th>
                                <th className="border px-3 py-2 text-left">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {organisasiRisets.map((item) => (
                                <tr key={item.id}>
                                    <td className="border px-3 py-2">{item.id}</td>
                                    <td className="border px-3 py-2">{item.organisasi_riset}</td>
                                    <td className="border px-3 py-2">
                                        <button
                                            className="rounded bg-red-100 px-3 py-1 text-red-700 hover:bg-red-200"
                                            onClick={() => {
                                                const value = prompt('Ubah nama organisasi riset:', item.organisasi_riset);
                                                if (value !== null && value.trim() !== '') {
                                                    router.put(
                                                        route('admin.master-data.organisasi.update', item.id),
                                                        { organisasi_riset: value.trim() },
                                                        { preserveScroll: true },
                                                    );
                                                }
                                            }}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="ml-2 rounded bg-gray-100 px-3 py-1 text-gray-700 hover:bg-gray-200"
                                            onClick={() => router.delete(route('admin.master-data.organisasi.destroy', item.id), { preserveScroll: true })}
                                        >
                                            Hapus
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
                )}

                {activeTab === 'unit' && (
                <section className="rounded-xl border bg-white p-4 shadow-lg">
                    <h2 className="mb-3 text-xl font-bold">Unit Kerja</h2>
                    {!isSuperAdmin && (
                        <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                            Hanya superadmin yang dapat menambah, mengubah, dan menghapus unit kerja.
                        </p>
                    )}
                    <form onSubmit={submitUnit} className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-5">
                        <select
                            className="h-10 rounded-md border px-3"
                            value={newUnit.organisasi_riset_id}
                            onChange={(e) => setNewUnit({ ...newUnit, organisasi_riset_id: e.target.value })}
                            disabled={!isSuperAdmin}
                        >
                            <option value="">Pilih organisasi riset</option>
                            {organisasiRisets.map((o) => (
                                <option key={o.id} value={o.id}>
                                    {o.organisasi_riset}
                                </option>
                            ))}
                        </select>
                        <input
                            className="h-10 rounded-md border px-3"
                            value={newUnit.kode_unit}
                            onChange={(e) => setNewUnit({ ...newUnit, kode_unit: e.target.value })}
                            placeholder="Kode unit"
                            required
                            disabled={!isSuperAdmin}
                        />
                        <input
                            className="h-10 rounded-md border px-3"
                            value={newUnit.nama_unit}
                            onChange={(e) => setNewUnit({ ...newUnit, nama_unit: e.target.value })}
                            placeholder="Nama unit"
                            required
                            disabled={!isSuperAdmin}
                        />
                        <input
                            className="h-10 rounded-md border px-3"
                            value={newUnit.kelompok_riset}
                            onChange={(e) => setNewUnit({ ...newUnit, kelompok_riset: e.target.value })}
                            placeholder="Kelompok riset default"
                            required
                            disabled={!isSuperAdmin}
                        />
                        <select
                            className="h-10 rounded-md border px-3"
                            value={newUnit.level}
                            onChange={(e) => setNewUnit({ ...newUnit, level: e.target.value as UnitKerja['level'] })}
                            disabled={!isSuperAdmin}
                        >
                            {levels.map((level) => (
                                <option key={level} value={level}>
                                    {level}
                                </option>
                            ))}
                        </select>
                        <button
                            type="submit"
                            disabled={!isSuperAdmin}
                            className="rounded-md bg-[#E62F2A] px-4 py-2 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-400 md:col-span-5"
                        >
                            Tambah Unit Kerja
                        </button>
                    </form>
                    <table className="w-full border text-sm">
                        <thead className="bg-[#E62F2A] text-white">
                            <tr>
                                <th className="border px-3 py-2 text-left">ID</th>
                                <th className="border px-3 py-2 text-left">Organisasi</th>
                                <th className="border px-3 py-2 text-left">Kode Unit</th>
                                <th className="border px-3 py-2 text-left">Nama Unit</th>
                                <th className="border px-3 py-2 text-left">Kelompok Riset</th>
                                <th className="border px-3 py-2 text-left">Level</th>
                                <th className="border px-3 py-2 text-left">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {units.map((item) => (
                                <tr key={item.id}>
                                    <td className="border px-3 py-2">{item.id}</td>
                                    <td className="border px-3 py-2">{item.organisasi_riset?.organisasi_riset ?? '-'}</td>
                                    <td className="border px-3 py-2">{item.kode_unit}</td>
                                    <td className="border px-3 py-2">{item.nama_unit}</td>
                                    <td className="border px-3 py-2">{item.kelompok_riset}</td>
                                    <td className="border px-3 py-2">{item.level}</td>
                                    <td className="border px-3 py-2">
                                        <button
                                            className="rounded bg-red-100 px-3 py-1 text-red-700 hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                                            onClick={() => openEditUnit(item)}
                                            disabled={!isSuperAdmin}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="ml-2 rounded bg-gray-100 px-3 py-1 text-gray-700 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                                            onClick={() => router.delete(route('admin.master-data.unit.destroy', item.id), { preserveScroll: true })}
                                            disabled={!isSuperAdmin}
                                        >
                                            Hapus
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
                )}

                {activeTab === 'kelompok' && (
                <section className="rounded-xl border bg-white p-4 shadow-lg">
                    <h2 className="mb-3 text-xl font-bold">Kelompok Riset</h2>
                    <form onSubmit={submitKelompok} className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-3">
                        <input
                            className="h-10 rounded-md border px-3"
                            list="unit-kerja-autocomplete"
                            value={newKelompok.unit_kerja_nama}
                            onChange={(e) => handleNewKelompokUnitKerjaChange(e.target.value)}
                            placeholder="Cari unit kerja..."
                            required
                        />
                        <datalist id="unit-kerja-autocomplete">
                            {units.map((u) => (
                                <option key={u.id} value={u.nama_unit} />
                            ))}
                        </datalist>
                        <input
                            className="h-10 rounded-md border px-3"
                            value={newKelompok.kelompok_riset}
                            onChange={(e) => setNewKelompok({ ...newKelompok, kelompok_riset: e.target.value })}
                            placeholder="Nama kelompok riset"
                            required
                        />
                        <button className="rounded-md bg-[#E62F2A] px-4 text-white hover:bg-red-700">Tambah Kelompok</button>
                    </form>
                    <table className="w-full border text-sm">
                        <thead className="bg-[#E62F2A] text-white">
                            <tr>
                                <th className="border px-3 py-2 text-left">ID</th>
                                <th className="border px-3 py-2 text-left">Unit Kerja</th>
                                <th className="border px-3 py-2 text-left">Kelompok Riset</th>
                                <th className="border px-3 py-2 text-left">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {kelompokRisets.map((item) => (
                                <tr key={item.id}>
                                    <td className="border px-3 py-2">{item.id}</td>
                                    <td className="border px-3 py-2">{item.unit_kerja?.nama_unit ?? '-'}</td>
                                    <td className="border px-3 py-2">{item.kelompok_riset}</td>
                                    <td className="border px-3 py-2">
                                        <button
                                            className="rounded bg-red-100 px-3 py-1 text-red-700 hover:bg-red-200"
                                            onClick={() => openEditKelompok(item)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="ml-2 rounded bg-gray-100 px-3 py-1 text-gray-700 hover:bg-gray-200"
                                            onClick={() => router.delete(route('admin.master-data.kelompok.destroy', item.id), { preserveScroll: true })}
                                        >
                                            Hapus
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
                )}

                {editingKelompok && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="w-full max-w-xl rounded-lg bg-white p-6 shadow-lg">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-xl font-bold">Edit Kelompok Riset</h3>
                                <button className="text-gray-600 hover:text-black" onClick={() => setEditingKelompok(null)}>
                                    Tutup
                                </button>
                            </div>
                            <form onSubmit={submitEditKelompok} className="grid grid-cols-1 gap-3">
                                <input
                                    className="h-10 rounded-md border px-3"
                                    list="unit-kerja-autocomplete-edit"
                                    value={editKelompokForm.unit_kerja_nama}
                                    onChange={(e) => handleEditKelompokUnitKerjaChange(e.target.value)}
                                    placeholder="Cari unit kerja..."
                                    required
                                />
                                <datalist id="unit-kerja-autocomplete-edit">
                                    {units.map((u) => (
                                        <option key={u.id} value={u.nama_unit} />
                                    ))}
                                </datalist>
                                <input
                                    className="h-10 rounded-md border px-3"
                                    value={editKelompokForm.kelompok_riset}
                                    onChange={(e) => setEditKelompokForm({ ...editKelompokForm, kelompok_riset: e.target.value })}
                                    placeholder="Nama kelompok riset"
                                    required
                                />
                                <div className="mt-2 flex justify-end gap-2">
                                    <button type="button" className="rounded-md bg-gray-200 px-4 py-2 hover:bg-gray-300" onClick={() => setEditingKelompok(null)}>
                                        Batal
                                    </button>
                                    <button type="submit" className="rounded-md bg-[#E62F2A] px-4 py-2 text-white hover:bg-red-700">
                                        Simpan Perubahan
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {editingUnit && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-xl font-bold">Edit Unit Kerja</h3>
                                <button className="text-gray-600 hover:text-black" onClick={() => setEditingUnit(null)}>
                                    Tutup
                                </button>
                            </div>

                            <form onSubmit={submitEditUnit} className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                <select
                                    className="h-10 rounded-md border px-3"
                                    value={editUnitForm.organisasi_riset_id}
                                    onChange={(e) => setEditUnitForm({ ...editUnitForm, organisasi_riset_id: e.target.value })}
                                >
                                    <option value="">Pilih organisasi riset</option>
                                    {organisasiRisets.map((o) => (
                                        <option key={o.id} value={o.id}>
                                            {o.organisasi_riset}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    className="h-10 rounded-md border px-3"
                                    value={editUnitForm.kode_unit}
                                    onChange={(e) => setEditUnitForm({ ...editUnitForm, kode_unit: e.target.value })}
                                    placeholder="Kode unit"
                                    required
                                />
                                <input
                                    className="h-10 rounded-md border px-3"
                                    value={editUnitForm.nama_unit}
                                    onChange={(e) => setEditUnitForm({ ...editUnitForm, nama_unit: e.target.value })}
                                    placeholder="Nama unit"
                                    required
                                />
                                <input
                                    className="h-10 rounded-md border px-3"
                                    value={editUnitForm.kelompok_riset}
                                    onChange={(e) => setEditUnitForm({ ...editUnitForm, kelompok_riset: e.target.value })}
                                    placeholder="Kelompok riset default"
                                    required
                                />
                                <select
                                    className="h-10 rounded-md border px-3 md:col-span-2"
                                    value={editUnitForm.level}
                                    onChange={(e) => setEditUnitForm({ ...editUnitForm, level: e.target.value as UnitKerja['level'] })}
                                >
                                    {levels.map((level) => (
                                        <option key={level} value={level}>
                                            {level}
                                        </option>
                                    ))}
                                </select>
                                <div className="mt-2 flex justify-end gap-2 md:col-span-2">
                                    <button type="button" className="rounded-md bg-gray-200 px-4 py-2 hover:bg-gray-300" onClick={() => setEditingUnit(null)}>
                                        Batal
                                    </button>
                                    <button type="submit" className="rounded-md bg-[#E62F2A] px-4 py-2 text-white hover:bg-red-700">
                                        Simpan Perubahan
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
