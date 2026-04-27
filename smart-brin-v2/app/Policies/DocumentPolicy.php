<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Document;

class DocumentPolicy
{
    /**
     * Peneliti hanya bisa melihat dokumennya sendiri.
     * Monev, kepala, dan admin bisa melihat semua dokumen.
     */
    public function view(User $user, Document $document): bool
    {
        return $user->role !== 'researcher' || $user->id === $document->user_id;
    }

    /**
     * Monev bisa mengedit (terbatas), head bisa edit semua, 
     * peneliti hanya bisa edit miliknya sendiri.
     * Admin tidak bisa edit dokumen.
     */
    public function update(User $user, Document $document): bool
    {
        return match ($user->role) {
            'monev', 'head' => true,
            'researcher'    => $user->id === $document->user_id,
            default         => false,
        };
    }

    /**
     * Hapus hanya bisa oleh peneliti (atas dokumennya) dan kepala.
     * Monev dan admin tidak bisa hapus.
     */
    public function delete(User $user, Document $document): bool
    {
        return match ($user->role) {
            'head'          => true,
            'researcher'    => $user->id === $document->user_id,
            default         => false,
        };
    }

    /**
     * Hanya peneliti dan kepala yang bisa buat dokumen.
     * Admin tidak bisa buat dokumen.
     */
    public function create(User $user): bool
    {
        return in_array($user->role, ['researcher', 'head']);
    }

    /**
     * Laporan hanya untuk role monev dan kepala.
     * Admin tidak bisa akses laporan.
     */
    public function viewReport(User $user): bool
    {
        return in_array($user->role, ['monev', 'head']);
    }

    /**
     * Hanya admin dan superadmin yang bisa kelola user.
     */
    public function manageUsers(User $user): bool
    {
        return in_array($user->role, ['admin', 'superadmin']);
    }

    /**
     * Hanya admin dan superadmin yang bisa mengelola tabel master.
     */
    public function manageAdminTables(User $user): bool
    {
        return in_array($user->role, ['admin', 'superadmin']);
    }

    /**
     * CRUD Unit Kerja hanya untuk superadmin.
     */
    public function manageUnitKerja(User $user): bool
    {
        return $user->role === 'superadmin';
    }

    /**
     * Modul scraping publikasi hanya untuk superadmin.
     */
    public function manageScraping(User $user): bool
    {
        return $user->role === 'superadmin';
    }
}
