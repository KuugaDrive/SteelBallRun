<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\MsUnitKerja;
use App\Models\MsKelompokRiset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rules;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Inertia\Inertia;
use Inertia\Response;

class UserManagementController extends Controller
{
    use AuthorizesRequests;

    public function index(): Response
    {
        $this->authorizeAdminOrHead();

        $users = User::with(['unitKerja:id,nama_unit,kode_unit', 'kelompokRiset:id,unit_kerja_id,kelompok_riset'])
            ->orderBy('id', 'asc')
            ->get();
        $unitKerjaOptions = MsUnitKerja::query()
            ->select(['id', 'kode_unit', 'nama_unit'])
            ->orderBy('nama_unit')
            ->get();
        $kelompokRisetOptions = MsKelompokRiset::query()
            ->select(['id', 'unit_kerja_id', 'kelompok_riset'])
            ->orderBy('kelompok_riset')
            ->get();

        return Inertia::render('accountmanagement', [
            'users' => $users,
            'unitKerjaOptions' => $unitKerjaOptions,
            'kelompokRisetOptions' => $kelompokRisetOptions,
        ]);
    }

    public function store(Request $request)
    {
        $this->authorizeAdminOrHead();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:users,email',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'role' => 'required|in:head,researcher,monev,admin,superadmin',
            'unit_kerja_id' => 'nullable|exists:ms_unit_kerja,id',
            'tingkat_fungsional' => 'nullable|in:utama,madya,muda,pertama',
            'jenis_fungsional' => 'nullable|string|max:255',
            'research_group' => 'nullable|uuid|exists:ms_kelompok_riset,id',
            'google_scholar_id' => 'nullable|string|max:255',
        ]);

        DB::beginTransaction();
        try {
            $googleScholarId = isset($validated['google_scholar_id']) ? trim((string) $validated['google_scholar_id']) : '';

            User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => $validated['role'],
                'unit_kerja_id' => $validated['unit_kerja_id'] ?? null,
                'tingkat_fungsional' => $validated['tingkat_fungsional'] ?? null,
                'jenis_fungsional' => $validated['jenis_fungsional'] ?? null,
                'research_group' => $validated['research_group'] ?? null,
                'google_scholar_id' => $googleScholarId !== '' ? $googleScholarId : null,
            ]);
            DB::commit();

            return back()->with('success', 'User berhasil ditambahkan.');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Gagal menambahkan user', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return back()->withErrors([
                'error' => 'Gagal menambahkan user: ' . $e->getMessage(),
            ]);
        }
    }

    public function updateRole(Request $request, User $user)
    {
        $this->authorizeAdminOrHead();

        $validated = $this->validateRole($request);

        DB::beginTransaction();
        try {
            $user->update(['role' => $validated['role']]);
            DB::commit();

            return back()->with('success', 'Role berhasil diperbarui.');
        } catch (\Throwable $e) {
            DB::rollBack();
            return back()->withErrors([
                'error' => 'Gagal memperbarui role pengguna.'
            ]);
        }
    }

    public function update(Request $request, User $user)
    {
        $this->authorizeAdminOrHead();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:users,email,' . $user->id,
            'password' => ['nullable', 'confirmed', Rules\Password::defaults()],
            'unit_kerja_id' => 'nullable|exists:ms_unit_kerja,id',
            'tingkat_fungsional' => 'nullable|in:utama,madya,muda,pertama',
            'jenis_fungsional' => 'nullable|string|max:255',
            'research_group' => 'nullable|uuid|exists:ms_kelompok_riset,id',
            'google_scholar_id' => 'nullable|string|max:255',
        ]);

        DB::beginTransaction();
        try {
            $googleScholarId = isset($validated['google_scholar_id']) ? trim((string) $validated['google_scholar_id']) : '';

            $payload = [
                'name' => $validated['name'],
                'email' => $validated['email'],
                'unit_kerja_id' => $validated['unit_kerja_id'] ?? null,
                'tingkat_fungsional' => $validated['tingkat_fungsional'] ?? null,
                'jenis_fungsional' => $validated['jenis_fungsional'] ?? null,
                'research_group' => $validated['research_group'] ?? null,
                'google_scholar_id' => $googleScholarId !== '' ? $googleScholarId : null,
            ];

            if (! empty($validated['password'])) {
                $payload['password'] = Hash::make($validated['password']);
            }

            $user->update($payload);
            DB::commit();

            return back()->with('success', 'Data user berhasil diperbarui.');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Gagal memperbarui data user', [
                'user_id' => $user->id,
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return back()->withErrors([
                'error' => 'Gagal memperbarui data user: ' . $e->getMessage(),
            ]);
        }
    }

    public function updateUnitKerja(Request $request, User $user)
    {
        $this->authorizeAdminOrHead();

        $validated = $request->validate([
            'unit_kerja_id' => 'nullable|exists:ms_unit_kerja,id',
        ]);

        DB::beginTransaction();
        try {
            $user->update([
                'unit_kerja_id' => $validated['unit_kerja_id'] ?? null,
            ]);
            DB::commit();

            return back()->with('success', 'Unit kerja user berhasil diperbarui.');
        } catch (\Throwable $e) {
            DB::rollBack();
            return back()->withErrors([
                'error' => 'Gagal memperbarui unit kerja user.'
            ]);
        }
    }

    public function destroy(User $user)
    {
        $this->authorizeAdminOrHead();

        if (Auth::id() === $user->id) {
            return back()->withErrors([
                'error' => 'Anda tidak dapat menghapus akun Anda sendiri.'
            ]);
        }

        DB::beginTransaction();
        try {
            $user->delete();
            DB::commit();

            return back()->with('success', 'User berhasil dihapus.');
        } catch (\Throwable $e) {
            DB::rollBack();
            return back()->withErrors([
                'error' => 'Gagal menghapus user.'
            ]);
        }
    }

    private function authorizeAdminOrHead(): void
    {
        $this->authorize('manageUsers', User::class);
    }

    private function validateRole(Request $request): array
    {
        return $request->validate([
            'role' => 'required|in:head,researcher,monev,admin,superadmin',
        ]);
    }
}

