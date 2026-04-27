<?php

namespace App\Http\Controllers;

use App\Models\TargetTahunan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class TargetTahunanController extends Controller
{
    /**
     * Menampilkan halaman daftar target tahunan.
     * Dapat diakses oleh 'head' dan 'monev'.
     */
    public function index(): Response
    {
        $this->authorizeViewer();

        $targets = TargetTahunan::orderByDesc('tahun')->get();

        return Inertia::render('target-capaian', compact('targets'));
    }

    /**
     * Menyimpan target tahunan baru.
     * Hanya dapat diakses oleh 'head'.
     */
    public function store(Request $request)
    {
        $this->authorizeHead();

        $validated = $this->validateTarget($request);

        DB::beginTransaction();
        try {
            TargetTahunan::updateOrCreate(
                ['tahun' => $validated['tahun']],
                $validated
            );

            DB::commit();
            return redirect()
                ->route('target-tahunan.index')
                ->with('success', 'Target tahunan berhasil disimpan.');
        } catch (\Throwable $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Gagal menyimpan target tahunan.'])->withInput();
        }
    }

    /**
     * Menampilkan form edit target tahunan.
     * Hanya dapat diakses oleh 'head'.
     */
    public function edit($id): Response
    {
        $this->authorizeHead();

        $target = TargetTahunan::findOrFail($id);

        return Inertia::render('target-edit', compact('target'));
    }

    /**
     * Memperbarui target tahunan yang ada.
     * Hanya dapat diakses oleh 'head'.
     */
    public function update(Request $request, $id)
    {
        $this->authorizeHead();

        $validated = $this->validateTarget($request);

        DB::beginTransaction();
        try {
            $target = TargetTahunan::findOrFail($id);
            $target->update($validated);

            DB::commit();
            return redirect()
                ->route('target-tahunan.index')
                ->with('success', 'Target tahunan berhasil diperbarui.');
        } catch (\Throwable $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Gagal memperbarui target tahunan.'])->withInput();
        }
    }

    /**
     * Menghapus target tahunan.
     * Hanya dapat diakses oleh 'head'.
     */
    public function destroy($id)
    {
        $this->authorizeHead();

        DB::beginTransaction();
        try {
            TargetTahunan::findOrFail($id)->delete();
            DB::commit();

            return redirect()
                ->route('target-tahunan.index')
                ->with('success', 'Target tahunan berhasil dihapus.');
        } catch (\Throwable $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Gagal menghapus target tahunan.']);
        }
    }

    /**
     * Otorisasi aksi hanya untuk peran 'head'.
     */
    private function authorizeHead(): void
    {
        abort_if(Auth::user()?->role !== 'head', 403, 'Unauthorized Action');
    }

    /**
     * Otorisasi untuk melihat data, diizinkan untuk 'head' dan 'monev'.
     */
    private function authorizeViewer(): void
    {
        abort_if(
            !in_array(Auth::user()?->role, ['head', 'monev']),
            403,
            'Unauthorized'
        );
    }

    /**
     * Validasi data request untuk target tahunan.
     */
    private function validateTarget(Request $request): array
    {
        return $request->validate([
            'tahun' => 'required|integer|digits:4',
            'kekayaan_intelektual' => 'required|integer|min:0',
            'publikasi_ilmiah_global' => 'required|integer|min:0',
            'purwarupa' => 'required|integer|min:0',
            'kerjasama_internasional' => 'required|integer|min:0',
            'kerjasama_nasional' => 'required|integer|min:0',
            'dana_eksternal' => 'required|integer|min:0',
            'sdm_studi_lanjut' => 'required|integer|min:0',
            'postdoc_visiting' => 'required|integer|min:0',
            'pelatihan_internasional' => 'required|integer|min:0',
        ]);
    }
}
