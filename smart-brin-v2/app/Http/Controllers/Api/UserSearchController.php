<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UserSearchController extends Controller
{
    /**
     * Cari nama pengguna berdasarkan keyword (name), dengan fuzzy matching.
     * Handles: gelar/titel sebelum dan sesudah nama, duplikasi nama (e.g., "Yaniasih Yaniasih" → "Yaniasih").
     */
    public function search(Request $request)
    {
        $keyword = trim((string) $request->input('q', ''));

        if (strlen($keyword) < 2) {
            return response()->json([]);
        }

        // Sanitize: strip common Indonesian academic titles and deduplicate words.
        $normalized = $this->normalizeSearchKeyword($keyword);

        // Build OR conditions: match on original keyword OR on each significant word.
        $words = array_filter(explode(' ', $normalized), fn($w) => strlen($w) >= 3);

        $query = User::select('id', 'name');

        $query->where(function ($q) use ($keyword, $words) {
            // Original keyword substring match
            $q->where('name', 'ILIKE', '%' . $keyword . '%');

            // Each cleaned word substring match (handles title-stripped names)
            foreach ($words as $word) {
                $q->orWhere('name', 'ILIKE', '%' . $word . '%');
            }
        });

        $users = $query->orderBy('name')->limit(15)->get()->map(function ($user) {
            return [
                'id'    => $user->id,
                'name'  => $user->name,
                'label' => $user->name,
                'value' => $user->name,
            ];
        });

        return response()->json($users);
    }

    /**
     * Normalize a search keyword:
     *  - Remove common academic titles (S.T., M.Kom., Dr., Prof., etc.)
     *  - Remove duplicated consecutive words (e.g., "Yaniasih Yaniasih" → "Yaniasih")
     */
    private function normalizeSearchKeyword(string $input): string
    {
        // Strip academic title patterns: initials like S.Kom., M.T., Ph.D., Dr., Prof., etc.
        $cleaned = preg_replace(
            '/\b(?:Prof|Dr|Ir|Drs|Dra|M\.?Sc|M\.?Kom|M\.?T|M\.?P|S\.?Kom|S\.?T|S\.?P|S\.?I|Ph\.?D|M\.?A|S\.?E|M\.?M|S\.?Ag|S\.?H)\.?\b/i',
            '',
            $input
        );

        // Normalize whitespace
        $cleaned = preg_replace('/\s+/', ' ', $cleaned);
        $cleaned = trim($cleaned);

        // Remove duplicated consecutive words (case-insensitive)
        $words  = explode(' ', $cleaned);
        $result = [];
        $prev   = null;
        foreach ($words as $word) {
            if (strtolower($word) !== strtolower((string) $prev)) {
                $result[] = $word;
            }
            $prev = $word;
        }

        return implode(' ', $result);
    }
}
