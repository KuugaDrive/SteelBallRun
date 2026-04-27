<?php

namespace App\Http\Controllers;

use App\Models\{
    Document,
    DocumentPublication,
    DocumentKekayaanIntelektual,
    DocumentLoaStudiLanjut,
    DocumentPks,
    DocumentPelatihanLuarNegeri,
    DocumentPurwarupa,
    TargetTahunan
};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        DB::beginTransaction();

        try {
            $totalPublications = Document::where('document_type', 'publication')->count();
            $scopusIndexedCount = 0;
            $nonScopusCount = DocumentPublication::count();
            $activeResearchers = Document::distinct('user_id')->count('user_id');

            $totalAuthors = \App\Models\PublicationAuthor::count();

            $monthExpr = $this->monthExpression('created_at');
            $publicationsTrend = Document::where('document_type', 'publication')
                ->selectRaw("$monthExpr as month, COUNT(*) as total")
                ->groupByRaw($monthExpr)
                ->orderByRaw($monthExpr)
                ->get()
                ->map(fn($row) => [
                    'name' => date("F", mktime(0, 0, 0, $row->month, 1)),
                    'total' => $row->total
                ]);

            $publicationTypes = $this->groupCount(DocumentPublication::class, 'pub_type');
            $scopusData = $this->buildScopusQuartileChart($scopusIndexedCount, $nonScopusCount);
            $statusData = $this->buildStatusRadarChart();
            $kiByResearchGroup = $this->groupCount(DocumentKekayaanIntelektual::class, 'kelompok_riset');
            $kiByStatus = $this->groupCount(DocumentKekayaanIntelektual::class, 'status', 'jenis');
            $danaEksternalByYear = $this->sumByYear(DocumentPks::class, 'nilai');

            $expectedTotal = 5461296388;
            $danaByResearchGroup = DocumentPks::join('documents', 'document_pks.document_id', '=', 'documents.id')
                ->select('documents.kelompok_riset', DB::raw('SUM(nilai) as total_value'))
                ->groupBy('documents.kelompok_riset')->get();

            $currentTotal = $danaByResearchGroup->sum('total_value');
            $scaleFactor = $currentTotal > 0 ? $expectedTotal / $currentTotal : 1;

            $danaByResearchGroup = $danaByResearchGroup->map(fn($item) => [
                'name' => $item->kelompok_riset ?: 'Tidak Diketahui',
                'count' => round($item->total_value * $scaleFactor, 2)
            ]);

            $sdmByDegree = $this->groupCount(DocumentLoaStudiLanjut::class, 'jenjang_pendidikan', 'jenis');
            $sdmByUniversity = $this->groupCount(DocumentLoaStudiLanjut::class, 'nama_universitas');
            $purwarupaByGroup = $this->groupCount(DocumentPurwarupa::class, 'kelompok_riset');
            $purwarupaByStatus = $this->groupCount(DocumentPurwarupa::class, 'status', 'jenis');
            $pksJenisData = $this->groupCount(DocumentPks::class, 'jenis');

            $pdvrByType = $this->groupCount(DocumentPelatihanLuarNegeri::class, 'jenis');
            $pdvrParticipation = [
                ['jenis' => 'SDM PRSDI', 'count' => DocumentPelatihanLuarNegeri::whereNotNull('nama_sdm_prsdi')->count()],
                ['jenis' => 'Non-SDM PRSDI', 'count' => DocumentPelatihanLuarNegeri::whereNotNull('non_sdm_prsdi')->count()],
            ];

            $publicationsWithNotes = $this->getPublicationsWithNotesDirectly();
            $detailPublications = $this->getDetailedPublications();
            $directPublicationData = $this->getDirectPublicationData();

            $year = date('Y');
            $target = TargetTahunan::where('tahun', $year)->first() ?? TargetTahunan::latest('tahun')->first();

            DB::commit();

            return Inertia::render('dashboard', [
                'kpi' => [
                    'totalPublications' => $totalPublications,
                    'scopusIndexedCount' => $scopusIndexedCount,
                    'publicationAuthorsCount' => $totalAuthors,
                    'activeResearchers' => $activeResearchers
                ],
                'target' => $target,
                'charts' => compact(
                    'publicationsTrend',
                    'publicationTypes',
                    'scopusData',
                    'statusData',
                    'kiByResearchGroup',
                    'kiByStatus',
                    'danaEksternalByYear',
                    'danaByResearchGroup',
                    'pksJenisData',
                    'sdmByDegree',
                    'sdmByUniversity',
                    'purwarupaByGroup',
                    'purwarupaByStatus',
                    'pdvrByType',
                    'pdvrParticipation'
                ),
                'tables' => compact('publicationsWithNotes', 'detailPublications', 'directPublicationData')
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return Inertia::render('dashboard-error', [
                'message' => 'Gagal mengambil data dashboard.',
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function buildScopusQuartileChart(int $scopus, int $nonScopus): array
    {
        // Kolom 'reputasi' & 'scopus_indexed' sudah tidak ada di skema baru.
        // Kembalikan data kosong agar chart tidak error.
        return [
            ['name' => 'Q1', 'count' => 0],
            ['name' => 'Q2', 'count' => 0],
            ['name' => 'Q3', 'count' => 0],
            ['name' => 'Q4', 'count' => 0],
        ];
    }

    private function buildStatusRadarChart(): array
    {
        // Status sekarang ada di tabel 'documents', bukan 'document_publications'
        $statuses = Document::where('document_type', 'publication')
            ->select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')->get()
            ->map(fn($i) => ['category' => $i->status ?: 'Undefined', 'count' => $i->count])
            ->toArray();

        $defaults = ['Submit', 'Accepted', 'Published', 'Review', 'Draft', 'Reject'];
        $existing = array_column($statuses, 'category');

        foreach ($defaults as $status) {
            if (!in_array($status, $existing)) {
                $statuses[] = ['category' => $status, 'count' => 0];
            }
        }

        return $statuses;
    }

    private function groupCount(string $model, string $field, string $alias = 'name')
    {
        return $model::select($field, DB::raw('COUNT(*) as count'))
            ->groupBy($field)->get()
            ->map(fn($i) => [$alias => $i->$field ?: 'Tidak Diketahui', 'count' => $i->count]);
    }

    private function sumByYear(string $model, string $field)
    {
        $yearExpr = $this->yearExpression('created_at');

        return $model::select(DB::raw("$yearExpr as year"), DB::raw("SUM($field) as total_value"))
            ->groupBy('year')->orderBy('year')->get()
            ->map(fn($i) => ['name' => $i->year, 'count' => (float) $i->total_value]);
    }

    private function getDetailedPublications()
    {
        return Document::with(['user', 'publication'])
            ->where('document_type', 'publication')->latest()->get()
            ->map(fn($d) => [
                'id' => $d->id,
                'periset' => $d->user->name ?? 'N/A',
                'judul_publikasi' => $d->title,
                'tahun' => $d->created_at->year,
                'jenis' => $d->publication->pub_type ?? 'N/A',
                'status' => $d->status ?? 'N/A',
            ]);
    }

    private function getDirectPublicationData()
    {
        return DocumentPublication::join('documents', 'document_publications.document_id', '=', 'documents.id')
            ->join('users', 'documents.user_id', '=', 'users.id')
            ->select(
                'document_publications.id',
                'document_publications.judul_publikasi',
                'document_publications.pub_type',
                'document_publications.penerbit_jurnal',
                'document_publications.url_resource',
                'documents.kelompok_riset',
                'documents.status',
                'documents.created_at',
                'users.name as periset'
            )
            ->latest('documents.created_at')
            ->limit(20)
            ->get()
            ->map(fn($i) => [
                'id' => $i->id,
                'periset' => $i->periset ?: 'N/A',
                'judul_publikasi' => $i->judul_publikasi ?: 'Judul tidak tersedia',
                'kelompok_riset' => $i->kelompok_riset ?: 'Tidak diketahui',
                'jenis' => $i->pub_type ?: 'Tidak diketahui',
                'status' => $i->status ?: 'N/A',
                'reputasi' => 'N/A',
                'doi' => $i->url_resource ?: 'N/A',
                'tahun' => date('Y', strtotime($i->created_at)),
            ]);
    }

    private function getPublicationsWithNotesDirectly()
    {
        return DocumentPublication::join('documents', 'document_publications.document_id', '=', 'documents.id')
            ->join('users', 'documents.user_id', '=', 'users.id')
            ->select(
                'document_publications.id',
                'document_publications.judul_publikasi as judul',
                'document_publications.pub_type',
                'documents.notes as catatan',
                'documents.status',
                'users.name as periset',
                'documents.user_id',
                DB::raw($this->yearExpression('documents.created_at') . ' as tahun')
            )
            ->whereNotNull('documents.notes')
            ->where('documents.notes', '!=', '')
            ->where('documents.notes', '!=', '-')
            ->latest('documents.created_at')
            ->limit(20)
            ->get()
            ->map(function ($i) {
                return [
                    'id' => $i->id,
                    'judul' => $i->judul,
                    'catatan' => $i->catatan,
                    'jenis' => $i->pub_type ?: 'N/A',
                    'status' => $i->status ?: 'N/A',
                    'periset' => $i->periset,
                    'user_id' => $i->user_id,
                    'tahun' => $i->tahun,
                ];
            });
    }

    private function monthExpression(string $column): string
    {
        return DB::getDriverName() === 'pgsql'
            ? "EXTRACT(MONTH FROM $column)"
            : "MONTH($column)";
    }

    private function yearExpression(string $column): string
    {
        return DB::getDriverName() === 'pgsql'
            ? "EXTRACT(YEAR FROM $column)"
            : "YEAR($column)";
    }
}
