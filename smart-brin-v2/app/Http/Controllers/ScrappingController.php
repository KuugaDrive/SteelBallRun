<?php

namespace App\Http\Controllers;

use App\Models\DocumentExtraction;
use App\Models\MsKelompokRiset;
use App\Models\MsOrganisasiRiset;
use App\Models\MsUnitKerja;
use App\Models\User;
use App\Services\GeminiCoreFocusService;
use App\Services\GoogleScholarScraperService;
use App\Services\PublicationMappingService;
use App\Services\PublicationTypeClassifierService;
use App\Services\ScimagoQuartileService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ScrappingController extends Controller
{
    use AuthorizesRequests;

    public function index(ScimagoQuartileService $scimagoQuartileService): Response
    {
        $this->authorize('manageScraping', User::class);

        return Inertia::render('admin/scrapping', [
            'organisasiRisets' => MsOrganisasiRiset::query()
                ->select(['id', 'organisasi_riset'])
                ->orderBy('organisasi_riset')
                ->get(),
            'pusatRisets' => MsUnitKerja::query()
                ->select(['id', 'organisasi_riset_id', 'kode_unit', 'nama_unit'])
                ->where('level', 'Pusat Riset')
                ->orderBy('nama_unit')
                ->get(),
            'kelompokRisets' => MsKelompokRiset::query()
                ->select(['id', 'unit_kerja_id', 'kelompok_riset'])
                ->orderBy('kelompok_riset')
                ->get(),
            'users' => User::query()
                ->select(['id', 'name', 'email', 'unit_kerja_id', 'research_group', 'google_scholar_id'])
                ->whereNotNull('research_group')
                ->orderBy('name')
                ->get(),
            'yearOptions' => $this->buildYearOptions(),
            'scimagoCsv' => $scimagoQuartileService->getActiveCsvInfo(),
        ]);
    }

    public function uploadScimagoCsv(Request $request, ScimagoQuartileService $scimagoQuartileService): JsonResponse
    {
        $this->authorize('manageScraping', User::class);

        $validated = $request->validate([
            'csv_file' => 'required|file|mimes:csv,txt|max:20480',
        ]);

        /** @var UploadedFile $uploadedFile */
        $uploadedFile = $validated['csv_file'];
        $stream = fopen($uploadedFile->getRealPath(), 'rb');
        if ($stream === false) {
            return response()->json(['message' => 'File CSV tidak dapat dibaca.'], 422);
        }

        $stored = Storage::disk('local')->put(ScimagoQuartileService::UPLOADED_RELATIVE_PATH, $stream);
        fclose($stream);
        if (!$stored) {
            return response()->json(['message' => 'Gagal menyimpan file CSV SCImago di storage server.'], 500);
        }

        $scimagoQuartileService->resetCache();
        $info = $scimagoQuartileService->getActiveCsvInfo();
        Log::info('[SCIMAGO] upload success', $info);

        return response()->json([
            'message' => 'CSV SCImago berhasil diunggah.',
            'scimago_csv' => $info,
        ]);
    }

    public function deleteScimagoCsv(ScimagoQuartileService $scimagoQuartileService): JsonResponse
    {
        $this->authorize('manageScraping', User::class);

        Storage::disk('local')->delete(ScimagoQuartileService::UPLOADED_RELATIVE_PATH);
        $scimagoQuartileService->resetCache();
        Log::info('[SCIMAGO] uploaded csv deleted');

        return response()->json([
            'message' => 'CSV SCImago upload berhasil dihapus.',
            'scimago_csv' => $scimagoQuartileService->getActiveCsvInfo(),
        ]);
    }

    public function start(
        Request $request,
        GoogleScholarScraperService $scraperService,
        GeminiCoreFocusService $geminiCoreFocusService,
        PublicationTypeClassifierService $publicationTypeClassifierService,
        ScimagoQuartileService $scimagoQuartileService
    ): JsonResponse {
        $this->authorize('manageScraping', User::class);

        $validated = $request->validate([
            'organisasi_riset_id' => 'required|uuid|exists:ms_organisasi_riset,id',
            'pusat_riset_id' => 'required|uuid|exists:ms_unit_kerja,id',
            'kelompok_riset_id' => 'required|uuid|exists:ms_kelompok_riset,id',
            'user_id' => 'required|uuid|exists:users,id',
            'year' => 'required|integer|min:' . (now()->year - 1) . '|max:' . (now()->year + 5),
        ]);

        $unit = MsUnitKerja::query()
            ->where('id', $validated['pusat_riset_id'])
            ->where('organisasi_riset_id', $validated['organisasi_riset_id'])
            ->where('level', 'Pusat Riset')
            ->first();

        if (!$unit) {
            return response()->json(['message' => 'Pusat riset tidak valid untuk organisasi riset yang dipilih.'], 422);
        }

        $kelompok = MsKelompokRiset::query()
            ->where('id', $validated['kelompok_riset_id'])
            ->where('unit_kerja_id', $unit->id)
            ->first();

        if (!$kelompok) {
            return response()->json(['message' => 'Kelompok riset tidak valid untuk pusat riset yang dipilih.'], 422);
        }

        $user = User::query()
            ->where('id', $validated['user_id'])
            ->where('unit_kerja_id', $unit->id)
            ->first();

        if (!$user) {
            return response()->json(['message' => 'User tidak valid untuk pusat riset yang dipilih.'], 422);
        }

        if (!$user->google_scholar_id) {
            return response()->json(['message' => 'User belum memiliki Google Scholar ID.'], 422);
        }

        if ((string) $user->research_group !== (string) $kelompok->id) {
            return response()->json(['message' => 'User tidak berada pada kelompok riset yang dipilih.'], 422);
        }

        $scimagoInfo = $scimagoQuartileService->getActiveCsvInfo();
        if (($scimagoInfo['source'] ?? 'none') === 'none') {
            return response()->json([
                'message' => 'CSV SCImago belum tersedia. Upload CSV terlebih dahulu pada panel Rujukan SCImago.',
            ], 422);
        }

        try {
            $scrapedRows = $scraperService->scrapeByAuthorAndYear(
                (string) $user->name,
                (string) $user->google_scholar_id,
                (int) $validated['year']
            );
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }

        $result = [
            'processed' => 0,
            'inserted' => 0,
            'updated' => 0,
            'skipped' => 0,
        ];
        $savedIds = [];

        DB::transaction(function () use ($scrapedRows, $user, $geminiCoreFocusService, $publicationTypeClassifierService, $scimagoQuartileService, &$result, &$savedIds): void {
            $generateCoreFocusOnScrape = (bool) config('services.scraper.generate_core_focus_on_scrape', false);

            foreach ($scrapedRows as $row) {
                $title = trim((string) ($row['raw_title'] ?? ''));
                if ($title === '') {
                    $result['skipped']++;
                    continue;
                }

                $publicationYear = isset($row['publication_year']) && is_numeric($row['publication_year'])
                    ? (int) $row['publication_year']
                    : null;

                // PERBAIKAN: Menangani raw_author_list yang mungkin sudah berupa array dari scraper Python
                $rawAuthorListArray = $this->normalizeJsonColumn($row['raw_author_list'] ?? null);
                $rawAuthorListJson = is_array($rawAuthorListArray) ? json_encode($rawAuthorListArray) : null;

                // Sama halnya dengan ai_metadata
                $aiMetadataArray = $this->normalizeJsonColumn($row['ai_metadata'] ?? null);
                $aiMetadataJson = is_array($aiMetadataArray) ? json_encode($aiMetadataArray) : null;

                $scholarLink = $this->nullIfEmpty($row['scholar_link'] ?? null);
                $publisher = $this->nullIfEmpty($row['publisher'] ?? null);
                $doi = $this->nullIfEmpty($row['doi'] ?? null);
                $venueTitle = $this->resolveVenueTitle($row['title'] ?? null, $aiMetadataArray, $publisher);
                $issn = $this->resolveIssn($row['issn'] ?? null, $aiMetadataArray);
                $quartile = $scimagoQuartileService->resolveQuartileByIssn($issn);
                $rawPubType = $this->nullIfEmpty($row['pub_type'] ?? null);

                $classifiedPubType = $publicationTypeClassifierService->classify(
                    $aiMetadataArray,
                    $scholarLink,
                    $rawPubType,
                    $publisher
                );

                $documentExtraction = DocumentExtraction::query()
                    ->where('user_id', $user->id)
                    ->where('raw_title', $title)
                    ->where('publication_year', $publicationYear)
                    ->first();

                if (!$documentExtraction) {
                    $documentExtraction = new DocumentExtraction();
                    $documentExtraction->id = (string) Str::uuid();
                    $documentExtraction->user_id = $user->id;
                    $result['inserted']++;
                } else {
                    $result['updated']++;
                }

                $documentExtraction->raw_title = $title;
                $documentExtraction->raw_authors = $this->nullIfEmpty($row['raw_authors'] ?? null);

                // Gunakan nilai JSON string untuk disimpan ke database
                $documentExtraction->raw_author_list = $rawAuthorListJson;

                $documentExtraction->pub_type = $classifiedPubType;
                $documentExtraction->publication_year = $publicationYear;
                $documentExtraction->publisher = $publisher;
                $documentExtraction->doi = $doi;
                $documentExtraction->title = $venueTitle;
                $documentExtraction->issn = $issn;
                $documentExtraction->quartile = $quartile;
                $documentExtraction->scholar_link = $scholarLink;
                $documentExtraction->author_role = $this->nullIfEmpty($row['author_role'] ?? null);
                $documentExtraction->author_order = isset($row['author_order']) && is_numeric($row['author_order'])
                    ? (int) $row['author_order']
                    : null;
                $aiAbstract = $this->nullIfEmpty($row['ai_abstract'] ?? null);
                $aiCoreFocus = $this->nullIfEmpty($row['ai_core_focus'] ?? null);
                if ($generateCoreFocusOnScrape && !$aiCoreFocus) {
                    $aiCoreFocus = $geminiCoreFocusService->generateCoreFocus(
                        $title,
                        $aiAbstract,
                        $aiMetadataArray
                    ) ?? $documentExtraction->ai_core_focus;
                }

                $documentExtraction->ai_abstract = $aiAbstract;
                $documentExtraction->ai_core_focus = $this->nullIfEmpty($aiCoreFocus);

                // Gunakan nilai JSON string untuk disimpan ke database
                $documentExtraction->ai_metadata = $aiMetadataJson;

                $documentExtraction->status_mapping = 'unmapped';
                $documentExtraction->save();
                $savedIds[] = (string) $documentExtraction->id;

                $result['processed']++;
            }
        });

        $extractions = DocumentExtraction::query()
            ->select([
                'id',
                'raw_title',
                'raw_authors',
                'pub_type',
                'ai_core_focus',
                'publication_year',
                'publisher',
                'doi',
                'title',
                'issn',
                'quartile',
                'scholar_link',
                'status_mapping',
            ])
            ->whereIn('id', array_values(array_unique($savedIds)))
            ->orderByDesc('created_at')
            ->orderBy('raw_title')
            ->get();

        return response()->json([
            'message' => 'Scraping selesai.',
            ...$result,
            'extractions' => $extractions,
        ]);
    }

    public function results(Request $request): JsonResponse
    {
        $this->authorize('manageScraping', User::class);

        $validated = $request->validate([
            'organisasi_riset_id' => 'required|uuid|exists:ms_organisasi_riset,id',
            'pusat_riset_id' => 'required|uuid|exists:ms_unit_kerja,id',
            'kelompok_riset_id' => 'required|uuid|exists:ms_kelompok_riset,id',
            'user_id' => 'required|uuid|exists:users,id',
            'year' => 'required|integer|min:' . (now()->year - 1) . '|max:' . (now()->year + 5),
        ]);

        $unit = MsUnitKerja::query()
            ->where('id', $validated['pusat_riset_id'])
            ->where('organisasi_riset_id', $validated['organisasi_riset_id'])
            ->where('level', 'Pusat Riset')
            ->first();

        if (!$unit) {
            return response()->json(['message' => 'Pusat riset tidak valid untuk organisasi riset yang dipilih.'], 422);
        }

        $kelompok = MsKelompokRiset::query()
            ->where('id', $validated['kelompok_riset_id'])
            ->where('unit_kerja_id', $unit->id)
            ->first();

        if (!$kelompok) {
            return response()->json(['message' => 'Kelompok riset tidak valid untuk pusat riset yang dipilih.'], 422);
        }

        $user = User::query()
            ->where('id', $validated['user_id'])
            ->where('unit_kerja_id', $unit->id)
            ->first();

        if (!$user) {
            return response()->json(['message' => 'User tidak valid untuk pusat riset yang dipilih.'], 422);
        }

        if ((string) $user->research_group !== (string) $kelompok->id) {
            return response()->json(['message' => 'User tidak berada pada kelompok riset yang dipilih.'], 422);
        }

        return response()->json([
            'extractions' => $this->getDocumentExtractionResults((string) $user->id, (int) $validated['year']),
        ]);
    }

    public function manualReclassifyPubType(Request $request): JsonResponse
    {
        $this->authorize('manageScraping', User::class);

        $allowedTypes = $this->getAllowedPubTypes();
        $validated = $request->validate([
            'extraction_id' => 'required|uuid|exists:document_extractions,id',
            'pub_type' => ['required', 'string', Rule::in($allowedTypes)],
        ]);

        $extraction = DocumentExtraction::query()->findOrFail($validated['extraction_id']);
        $extraction->pub_type = $validated['pub_type'];
        $extraction->save();

        return response()->json([
            'message' => 'Pub type berhasil diperbarui.',
            'extraction' => [
                'id' => $extraction->id,
                'pub_type' => $extraction->pub_type,
            ],
        ]);
    }

    public function backfillAiCoreFocus(Request $request, GeminiCoreFocusService $geminiCoreFocusService): JsonResponse
    {
        $this->authorize('manageScraping', User::class);

        $validated = $request->validate([
            'organisasi_riset_id' => 'required|uuid|exists:ms_organisasi_riset,id',
            'pusat_riset_id' => 'required|uuid|exists:ms_unit_kerja,id',
            'kelompok_riset_id' => 'required|uuid|exists:ms_kelompok_riset,id',
            'user_id' => 'required|uuid|exists:users,id',
            'year' => 'required|integer|min:' . (now()->year - 1) . '|max:' . (now()->year + 5),
        ]);

        $unit = MsUnitKerja::query()
            ->where('id', $validated['pusat_riset_id'])
            ->where('organisasi_riset_id', $validated['organisasi_riset_id'])
            ->where('level', 'Pusat Riset')
            ->first();

        if (!$unit) {
            return response()->json(['message' => 'Pusat riset tidak valid untuk organisasi riset yang dipilih.'], 422);
        }

        $kelompok = MsKelompokRiset::query()
            ->where('id', $validated['kelompok_riset_id'])
            ->where('unit_kerja_id', $unit->id)
            ->first();

        if (!$kelompok) {
            return response()->json(['message' => 'Kelompok riset tidak valid untuk pusat riset yang dipilih.'], 422);
        }

        $user = User::query()
            ->where('id', $validated['user_id'])
            ->where('unit_kerja_id', $unit->id)
            ->first();

        if (!$user) {
            return response()->json(['message' => 'User tidak valid untuk pusat riset yang dipilih.'], 422);
        }

        if ((string) $user->research_group !== (string) $kelompok->id) {
            return response()->json(['message' => 'User tidak berada pada kelompok riset yang dipilih.'], 422);
        }

        $rows = DocumentExtraction::query()
            ->where('user_id', $user->id)
            ->where('publication_year', (int) $validated['year'])
            ->get();

        $processed = 0;
        $updated = 0;
        $skipped = 0;

        foreach ($rows as $row) {
            $processed++;

            $existingCoreFocus = $this->nullIfEmpty($row->ai_core_focus);
            if ($existingCoreFocus) {
                $skipped++;
                continue;
            }

            // Memastikan data JSON sudah di-decode ke array untuk diteruskan ke Service
            $aiMetadataArray = null;
            if (is_string($row->ai_metadata)) {
                $aiMetadataArray = json_decode($row->ai_metadata, true);
            } elseif (is_array($row->ai_metadata)) {
                $aiMetadataArray = $row->ai_metadata;
            }

            $generatedCoreFocus = $geminiCoreFocusService->generateCoreFocus(
                $this->nullIfEmpty($row->raw_title),
                $this->nullIfEmpty($row->ai_abstract),
                $aiMetadataArray
            );

            if (!$generatedCoreFocus) {
                $skipped++;
                continue;
            }

            $row->ai_core_focus = $generatedCoreFocus;
            $row->save();
            $updated++;
        }

        return response()->json([
            'message' => 'Backfill ai_core_focus selesai.',
            'processed' => $processed,
            'updated' => $updated,
            'skipped' => $skipped,
            'extractions' => $this->getDocumentExtractionResults((string) $user->id, (int) $validated['year']),
        ]);
    }

    public function mapDataToPublication(Request $request, PublicationMappingService $mappingService): JsonResponse
    {
        $this->authorize('manageScraping', User::class);

        $validated = $request->validate([
            'user_id' => 'required|uuid|exists:users,id',
        ]);

        $hasilMapping = $mappingService->mapAllUnmappedForUser($validated['user_id']);

        return response()->json([
            'message' => 'Proses mapping ke tabel utama selesai!',
            'hasil' => $hasilMapping
        ]);
    }

    /**
     * @return array<int, int>
     */
    private function buildYearOptions(): array
    {
        $baseYear = now()->year;
        $years = [];

        for ($year = $baseYear - 1; $year <= $baseYear + 5; $year++) {
            $years[] = $year;
        }

        return $years;
    }

    /**
     * Helper to reliably decode JSON data, whether it comes in as a JSON string
     * or is already decoded as an array.
     * * @return array<string, mixed>|null
     */
    private function normalizeJsonColumn(mixed $value): ?array
    {
        if (is_array($value)) {
            return $value;
        }

        if (!is_string($value) || trim($value) === '') {
            return null;
        }

        /** @var mixed $decoded */
        $decoded = json_decode($value, true);
        if (json_last_error() !== JSON_ERROR_NONE || !is_array($decoded)) {
            return null; // Return null if decoding failed or if it's not an array
        }

        return $decoded;
    }

    private function nullIfEmpty(mixed $value): ?string
    {
        if (!is_string($value)) {
            return null;
        }

        $trimmed = trim($value);
        return $trimmed === '' ? null : $trimmed;
    }

    private function resolveVenueTitle(mixed $rowTitle, ?array $aiMetadataArray, ?string $fallbackPublisher): ?string
    {
        $fromRow = $this->nullIfEmpty($rowTitle);
        if ($fromRow) {
            return $fromRow;
        }

        if (is_array($aiMetadataArray)) {
            foreach (['journal', 'conference', 'booktitle', 'venue', 'publisher'] as $key) {
                $candidate = $this->nullIfEmpty($aiMetadataArray[$key] ?? null);
                if ($candidate) {
                    return $candidate;
                }
            }
        }

        return $fallbackPublisher;
    }

    private function resolveIssn(mixed $rowIssn, ?array $aiMetadataArray): ?string
    {
        $issnPattern = '/\b\d{4}-?\d{3}[\dXx]\b/';
        $candidates = [];

        $fromRow = $this->nullIfEmpty($rowIssn);
        if ($fromRow) {
            $candidates[] = $fromRow;
        }

        if (is_array($aiMetadataArray)) {
            foreach (['issn', 'ISSN', 'citation', 'journal', 'booktitle', 'publisher'] as $key) {
                $candidate = $this->nullIfEmpty($aiMetadataArray[$key] ?? null);
                if ($candidate) {
                    $candidates[] = $candidate;
                }
            }
        }

        foreach ($candidates as $candidate) {
            $matchCount = preg_match_all($issnPattern, $candidate, $matches, PREG_OFFSET_CAPTURE);
            if ($matchCount === false || $matchCount < 1 || !isset($matches[0]) || !is_array($matches[0])) {
                continue;
            }

            foreach ($matches[0] as $matchWithOffset) {
                $rawMatch = is_array($matchWithOffset) ? (string) ($matchWithOffset[0] ?? '') : '';
                $offset = is_array($matchWithOffset) ? (int) ($matchWithOffset[1] ?? 0) : 0;
                if ($rawMatch === '') {
                    continue;
                }

                $leftContext = strtolower(substr($candidate, max(0, $offset - 15), 15));
                if (str_contains($leftContext, 'doi') || str_contains($leftContext, '10.') || str_contains($leftContext, 'pp') || str_contains($leftContext, 'pages')) {
                    continue;
                }

                $normalized = strtoupper(str_replace(' ', '', $rawMatch));
                if (strlen($normalized) === 8) {
                    $normalized = substr($normalized, 0, 4) . '-' . substr($normalized, 4);
                }

                if ($this->isValidIssn($normalized)) {
                    return $normalized;
                }
            }
        }

        return null;
    }

    private function isValidIssn(string $issn): bool
    {
        if (preg_match('/^(\d{4})-(\d{3}[\dX])$/i', $issn, $parts) !== 1) {
            return false;
        }

        $digits = strtoupper($parts[1] . $parts[2]);
        $total = 0;
        for ($i = 0; $i < 7; $i++) {
            $total += ((int) $digits[$i]) * (8 - $i);
        }

        $check = (11 - ($total % 11)) % 11;
        $expected = $check === 10 ? 'X' : (string) $check;

        return $digits[7] === $expected;
    }

    private function getDocumentExtractionResults(string $userId, int $year)
    {
        return DocumentExtraction::query()
            ->select([
                'id',
                'raw_title',
                'raw_authors',
                'pub_type',
                'ai_core_focus',
                'publication_year',
                'publisher',
                'doi',
                'title',
                'issn',
                'quartile',
                'scholar_link',
                'status_mapping',
            ])
            ->where('user_id', $userId)
            ->where('publication_year', $year)
            ->orderByDesc('created_at')
            ->orderBy('raw_title')
            ->get();
    }

    /**
     * @return array<int, string>
     */
    private function getAllowedPubTypes(): array
    {
        return [
            'Conference Paper',
            'Journal Article',
            'Book',
            'Book Chapter',
        ];
    }
}
