<?php
namespace App\Services;

use App\Models\Document;
use App\Models\DocumentExtraction;
use App\Models\DocumentPublication;
use App\Models\PublicationAuthor;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class PublicationMappingService
{
    public function mapAllUnmappedForUser(string $userId): array
    {
        $extractions = DocumentExtraction::where('user_id', $userId)
            ->where('status_mapping', 'unmapped')->get();

        $user = User::find($userId);
        if (!$user) {
            return ['mapped' => 0];
        }

        $groupName = DB::table('ms_kelompok_riset')
            ->where('id', $user->research_group)
            ->value('kelompok_riset');
        $researchGroupName = is_string($groupName) && trim($groupName) !== '' ? $groupName : 'Tidak Ada';

        $mappedCount = 0;

        /** @var DocumentExtraction $ext */
        foreach ($extractions as $ext) {
            DB::transaction(function () use ($ext, $user, $researchGroupName, &$mappedCount) {

                $normalizedTitle = trim($ext->raw_title ?? 'Untitled');
                $pubYear = $ext->publication_year;

                // ─────────────────────────────────────────────────────────────
                // DEDUPLICATION: cek apakah publikasi dengan judul & tahun yang
                // sama sudah ada di database (misal: co-author lain sudah input)
                // ─────────────────────────────────────────────────────────────
                $existingPub = DocumentPublication::whereRaw('LOWER(judul_publikasi) = ?', [strtolower($normalizedTitle)])
                    ->when($pubYear, fn($q) => $q->where('tahun_publikasi', $pubYear))
                    ->first();

                if ($existingPub) {
                    // Publikasi sudah ada — hanya tambahkan author baru yang belum tercatat
                    $this->ensureAuthorsLinked($existingPub, $ext, $user);
                } else {
                    // Publikasi belum ada — buat Document + DocumentPublication + Authors baru
                    $doc = Document::create([
                        'user_id' => $user->id,
                        'document_type' => 'publikasi-global',
                        'title' => $normalizedTitle,
                        'kelompok_riset' => $researchGroupName,
                        'status' => 'submitted',
                    ]);

                    $pub = DocumentPublication::create([
                        'document_id' => $doc->id,
                        'judul_publikasi' => $normalizedTitle,
                        'pub_type' => $ext->pub_type ?? 'Journal Article',
                        'penerbit_jurnal' => $ext->publisher,
                        'tahun_publikasi' => $pubYear,
                        'url_resource' => $ext->scholar_link,
                        'doi' => $ext->doi,
                        'issn' => $ext->issn,
                        'quartile' => $ext->quartile,
                        'inti_penelitian' => $ext->ai_core_focus,
                        'abstrak' => $ext->ai_abstract,
                    ]);

                    $this->ensureAuthorsLinked($pub, $ext, $user);
                }

                // Tandai extraction sebagai sudah di-mapping agar tidak diproses ulang
                $ext->status_mapping = 'mapped';
                $ext->save();
                $mappedCount++;
            });
        }

        return ['mapped' => $mappedCount];
    }

    /**
     * Pastikan setiap penulis dari extraction tercatat di publication_authors.
     * Jika nama penulis sudah ada (berdasarkan nama), skip — tidak duplikat.
     */
    private function ensureAuthorsLinked(DocumentPublication $pub, $ext, User $triggeringUser): void
    {
        $authors = [];
        $rawAuthorList = $ext->raw_author_list;
        if (is_string($rawAuthorList)) {
            $authors = json_decode($rawAuthorList, true) ?? [];
        } elseif (is_array($rawAuthorList)) {
            $authors = $rawAuthorList;
        }

        if (empty($authors) && !empty($ext->raw_authors)) {
            $authors = array_map('trim', explode(',', $ext->raw_authors));
        }

        // Ambil nama penulis yang sudah ada untuk deduplication
        $existingAuthorNames = $pub->authors()
            ->pluck('nama_penulis')
            ->map(fn($n) => strtolower(trim($n)))
            ->toArray();

        $order = $pub->authors()->max('urutan_penulis') ?? 0;

        foreach ($authors as $index => $name) {
            $name = trim($name);
            if (empty($name))
                continue;

            // Skip jika nama ini sudah ada di publication_authors untuk publikasi ini
            if (in_array(strtolower($name), $existingAuthorNames))
                continue;

            $order++;
            $realOrder = $index + 1; // urutan asli dari daftar penulis

            // Tahap 1: Pencocokan eksak (nama di paper = nama di DB tanpa gelar)
            $matchedUser = User::whereRaw('LOWER(name) = ?', [strtolower($name)])->first();

            // Tahap 2: Word-boundary match — menangani nama di DB yang pakai gelar akademik
            // Contoh: "Ana Hadiana" di paper cocok dengan "Prof. Dr. Ana Hadiana, M.Eng.Sc" di DB
            // Memastikan "Diana" tidak salah cocok ke "Ana Hadiana" (bukan di word boundary)
            if (!$matchedUser) {
                $candidates = User::whereRaw('LOWER(name) LIKE ?', ['%' . strtolower($name) . '%'])->get();
                foreach ($candidates as $candidate) {
                    $pattern = '/\b' . preg_quote($name, '/') . '\b/i';
                    if (preg_match($pattern, $candidate->name)) {
                        $matchedUser = $candidate;
                        break;
                    }
                }
            }

            PublicationAuthor::create([
                'publication_id' => $pub->id,
                'user_id' => $matchedUser?->id,
                'nama_penulis' => $name,
                'urutan_penulis' => $realOrder,
                'peran_penulis' => $realOrder === 1 ? 'First Author' : 'Co-Author',
                // is_internal_brin = true hanya jika email user mengandung brin.go.id
                'is_internal_brin' => $matchedUser ? str_contains((string) $matchedUser->email, 'brin.go.id') : false,
            ]);

            $existingAuthorNames[] = strtolower($name); // prevent in-loop duplicate
        }
    }
}
