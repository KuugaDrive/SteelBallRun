<?php

namespace App\Policies;

use App\Models\User;
use App\Models\MsUnitKerja;

class MsUnitKerjaPolicy
{
    /**
     * Hanya superadmin yang bisa manage Unit Kerja.
     */
    public function manageUnits(User $user): bool
    {
        return $user->role === 'superadmin';
    }

    /**
     * View all units - hanya superadmin
     */
    public function viewAny(User $user): bool
    {
        return $user->role === 'superadmin';
    }

    /**
     * View single unit - hanya superadmin
     */
    public function view(User $user, MsUnitKerja $unit): bool
    {
        return $user->role === 'superadmin';
    }

    /**
     * Create unit - hanya superadmin
     */
    public function create(User $user): bool
    {
        return $user->role === 'superadmin';
    }

    /**
     * Update unit - hanya superadmin
     */
    public function update(User $user, MsUnitKerja $unit): bool
    {
        return $user->role === 'superadmin';
    }

    /**
     * Delete unit - hanya superadmin
     */
    public function delete(User $user, MsUnitKerja $unit): bool
    {
        return $user->role === 'superadmin';
    }
}
