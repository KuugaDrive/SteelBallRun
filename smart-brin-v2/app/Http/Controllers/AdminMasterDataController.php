<?php

namespace App\Http\Controllers;

use App\Models\MsKelompokRiset;
use App\Models\MsOrganisasiRiset;
use App\Models\MsUnitKerja;
use App\Models\User;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminMasterDataController extends Controller
{
    use AuthorizesRequests;

    public function index(): Response
    {
        $this->authorize('manageAdminTables', User::class);

        return Inertia::render('admin/master-data', [
            'users' => User::with(['unitKerja:id,nama_unit,kode_unit', 'kelompokRiset:id,unit_kerja_id,kelompok_riset'])
                ->orderBy('id', 'asc')
                ->get(),
            'unitKerjaOptions' => MsUnitKerja::query()
                ->select(['id', 'kode_unit', 'nama_unit'])
                ->orderBy('nama_unit')
                ->get(),
            'kelompokRisetOptions' => MsKelompokRiset::query()
                ->select(['id', 'unit_kerja_id', 'kelompok_riset'])
                ->orderBy('kelompok_riset')
                ->get(),
            'organisasiRisets' => MsOrganisasiRiset::orderBy('id')->get(),
            'units' => MsUnitKerja::with('organisasiRiset')->orderBy('id')->get(),
            'kelompokRisets' => MsKelompokRiset::with('unitKerja')->orderBy('id')->get(),
        ]);
    }

    public function storeOrganisasiRiset(Request $request): RedirectResponse
    {
        $this->authorize('manageAdminTables', User::class);

        $validated = $request->validate([
            'organisasi_riset' => 'required|string|max:255|unique:ms_organisasi_riset,organisasi_riset',
        ]);

        MsOrganisasiRiset::create($validated);
        return back()->with('success', 'Organisasi riset berhasil ditambahkan.');
    }

    public function updateOrganisasiRiset(Request $request, MsOrganisasiRiset $organisasi): RedirectResponse
    {
        $this->authorize('manageAdminTables', User::class);

        $validated = $request->validate([
            'organisasi_riset' => 'required|string|max:255|unique:ms_organisasi_riset,organisasi_riset,' . $organisasi->id,
        ]);

        $organisasi->update($validated);
        return back()->with('success', 'Organisasi riset berhasil diperbarui.');
    }

    public function destroyOrganisasiRiset(MsOrganisasiRiset $organisasi): RedirectResponse
    {
        $this->authorize('manageAdminTables', User::class);

        $organisasi->delete();
        return back()->with('success', 'Organisasi riset berhasil dihapus.');
    }

    public function storeUnitKerja(Request $request): RedirectResponse
    {
        $this->authorize('manageUnitKerja', User::class);

        $validated = $request->validate([
            'organisasi_riset_id' => 'nullable|exists:ms_organisasi_riset,id',
            'kode_unit' => 'required|string|max:50|unique:ms_unit_kerja,kode_unit',
            'nama_unit' => 'required|string|max:255',
            'kelompok_riset' => 'required|string|max:255',
            'level' => 'required|in:Settama,Deputi,Inspektorat,Organisasi Riset,Pusat Riset',
        ]);

        MsUnitKerja::create($validated);
        return back()->with('success', 'Unit kerja berhasil ditambahkan.');
    }

    public function updateUnitKerja(Request $request, MsUnitKerja $unit): RedirectResponse
    {
        $this->authorize('manageUnitKerja', User::class);

        $validated = $request->validate([
            'organisasi_riset_id' => 'nullable|exists:ms_organisasi_riset,id',
            'kode_unit' => 'required|string|max:50|unique:ms_unit_kerja,kode_unit,' . $unit->id,
            'nama_unit' => 'required|string|max:255',
            'kelompok_riset' => 'required|string|max:255',
            'level' => 'required|in:Settama,Deputi,Inspektorat,Organisasi Riset,Pusat Riset',
        ]);

        $unit->update($validated);
        return back()->with('success', 'Unit kerja berhasil diperbarui.');
    }

    public function destroyUnitKerja(MsUnitKerja $unit): RedirectResponse
    {
        $this->authorize('manageUnitKerja', User::class);

        $unit->delete();
        return back()->with('success', 'Unit kerja berhasil dihapus.');
    }

    public function storeKelompokRiset(Request $request): RedirectResponse
    {
        $this->authorize('manageAdminTables', User::class);

        $validated = $request->validate([
            'unit_kerja_id' => 'required|exists:ms_unit_kerja,id',
            'kelompok_riset' => 'required|string|max:255',
        ]);

        MsKelompokRiset::create($validated);
        return back()->with('success', 'Kelompok riset berhasil ditambahkan.');
    }

    public function updateKelompokRiset(Request $request, MsKelompokRiset $kelompok): RedirectResponse
    {
        $this->authorize('manageAdminTables', User::class);

        $validated = $request->validate([
            'unit_kerja_id' => 'required|exists:ms_unit_kerja,id',
            'kelompok_riset' => 'required|string|max:255',
        ]);

        $kelompok->update($validated);
        return back()->with('success', 'Kelompok riset berhasil diperbarui.');
    }

    public function destroyKelompokRiset(MsKelompokRiset $kelompok): RedirectResponse
    {
        $this->authorize('manageAdminTables', User::class);

        $kelompok->delete();
        return back()->with('success', 'Kelompok riset berhasil dihapus.');
    }
}
