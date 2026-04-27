<?php

namespace App\Http\Controllers;

use App\Models\MsUnitKerja;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class MsUnitKerjaController extends Controller
{
    use AuthorizesRequests;

    /**
     * Display a listing of the units.
     */
    public function index(): Response
    {
        $this->authorize('manageUnits', MsUnitKerja::class);

        $units = MsUnitKerja::orderBy('id', 'asc')->get();

        return Inertia::render('management/units', [
            'units' => $units
        ]);
    }

    /**
     * Show the form for creating a new unit.
     */
    public function create(): Response
    {
        $this->authorize('create', MsUnitKerja::class);

        return Inertia::render('management/units-form', [
            'unit' => null,
            'isEdit' => false,
        ]);
    }

    /**
     * Store a newly created unit in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', MsUnitKerja::class);

        $validated = $request->validate([
            'kode_unit' => 'required|string|max:50|unique:ms_unit_kerja,kode_unit',
            'nama_unit' => 'required|string|max:255',
            'kelompok_riset' => 'required|string|max:255',
            'level' => 'required|in:Settama,Deputi,Inspektorat,Organisasi Riset,Pusat Riset',
        ]);

        DB::beginTransaction();
        try {
            MsUnitKerja::create($validated);
            DB::commit();

            return redirect()->route('units.index')
                            ->with('success', 'Unit kerja berhasil dibuat.');
        } catch (\Throwable $e) {
            DB::rollBack();
            return back()->withErrors([
                'error' => 'Gagal membuat unit kerja: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Show the form for editing the specified unit.
     */
    public function edit(MsUnitKerja $unit): Response
    {
        $this->authorize('update', $unit);

        return Inertia::render('management/units-form', [
            'unit' => $unit,
            'isEdit' => true,
        ]);
    }

    /**
     * Update the specified unit in storage.
     */
    public function update(Request $request, MsUnitKerja $unit): RedirectResponse
    {
        $this->authorize('update', $unit);

        $validated = $request->validate([
            'kode_unit' => 'required|string|max:50|unique:ms_unit_kerja,kode_unit,' . $unit->id,
            'nama_unit' => 'required|string|max:255',
            'kelompok_riset' => 'required|string|max:255',
            'level' => 'required|in:Settama,Deputi,Inspektorat,Organisasi Riset,Pusat Riset',
        ]);

        DB::beginTransaction();
        try {
            $unit->update($validated);
            DB::commit();

            return redirect()->route('units.index')
                            ->with('success', 'Unit kerja berhasil diperbarui.');
        } catch (\Throwable $e) {
            DB::rollBack();
            return back()->withErrors([
                'error' => 'Gagal memperbarui unit kerja: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Remove the specified unit from storage.
     */
    public function destroy(MsUnitKerja $unit): RedirectResponse
    {
        $this->authorize('delete', $unit);

        DB::beginTransaction();
        try {
            $unit->delete();
            DB::commit();

            return back()->with('success', 'Unit kerja berhasil dihapus.');
        } catch (\Throwable $e) {
            DB::rollBack();
            return back()->withErrors([
                'error' => 'Gagal menghapus unit kerja: ' . $e->getMessage()
            ]);
        }
    }
}
