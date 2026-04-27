import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import React from 'react';
import patternBg from '../assets/bg-pattern3.png';

import UserAccountTable, { KelompokRisetOption, UnitKerjaOption, User } from '@/components//AccountManagement/UserAccountTable';

/**
 * Halaman AccountManagement berfungsi sebagai "container" atau halaman induk.
 * Tugas utamanya adalah:
 * 1. Mengatur layout halaman (Header, Judul, Latar Belakang).
 * 2. Mengambil data 'users' dari server melalui props Inertia.
 * 3. Melewatkan data tersebut ke komponen UserAccountTable yang bertanggung jawab
 * atas semua logika dan tampilan tabel.
 */
function AccountManagement() {
    const breadcrumbs: BreadcrumbItem[] = [{ title: 'Account Management', href: '/users' }];

    // Mengambil data 'users' yang dikirim dari UserManagementController
    const { users, unitKerjaOptions, kelompokRisetOptions } = usePage<{
        users: User[];
        unitKerjaOptions: UnitKerjaOption[];
        kelompokRisetOptions: KelompokRisetOption[];
    }>().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Account Management BRIN" />

            <div
                className="flex flex-col flex-1 h-full gap-4 p-6 overflow-x-auto rounded-xl"
                style={{
                    backgroundImage: `url(${patternBg})`,
                }}
            >
                <div className="mb-4">
                    <h1 className="mb-1 text-4xl font-extrabold text-[#E62F2A]">Account Management PRSDI</h1>
                    <p className="text-md text-neutral-500">Manajemen Users SMART-BRIN PRSDI.</p>
                </div>

                {/* Kartu putih yang berisi tabel */}
                <div className="flex flex-col flex-grow p-4 bg-white border shadow-lg rounded-xl backdrop-blur-sm dark:bg-gray-900/80">
                    {/* Komponen tabel hanya perlu menerima data */}
                    <UserAccountTable data={users} unitKerjaOptions={unitKerjaOptions} kelompokRisetOptions={kelompokRisetOptions} />
                </div>
            </div>
        </AppLayout>
    );
}

export default React.memo(AccountManagement);
