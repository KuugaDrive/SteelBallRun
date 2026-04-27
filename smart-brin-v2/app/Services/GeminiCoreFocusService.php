<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiCoreFocusService
{
    public function generateCoreFocus(?string $title, ?string $abstract, ?array $metadata = null): ?string
    {
        $apiKey = (string) config('services.gemini.api_key', env('GEMINI_API_KEY', ''));
        if ($apiKey === '') {
            return $this->buildHeuristicFallback($title, $abstract, $metadata);
        }

        $sourceText = $this->buildSourceText($title, $abstract, $metadata);
        if ($sourceText === '') {
            return $this->buildHeuristicFallback($title, $abstract, $metadata);
        }

        $baseUrl = rtrim((string) config('services.gemini.base_url', 'https://generativelanguage.googleapis.com/v1beta'), '/');
        $models = $this->buildModelCandidates();

        $prompt = <<<PROMPT
Tentukan ai_core_focus publikasi berikut dalam 1 sampai 3 kata kunci saja (bukan kalimat).
Gunakan bahasa Indonesia bila memungkinkan.
Jangan gunakan bullet list, markdown, angka urut, atau penjelasan tambahan.
Contoh format valid: "Deteksi Hoaks", "Augmented Retrieval", "Kesehatan Mental".

Publikasi:
{$sourceText}
PROMPT;

        try {
            foreach ($models as $model) {
                $endpoint = sprintf('%s/models/%s:generateContent?key=%s', $baseUrl, $model, urlencode($apiKey));
                $response = Http::timeout(30)
                    ->connectTimeout(10)
                    ->post($endpoint, [
                        'contents' => [
                            [
                                'parts' => [
                                    ['text' => $prompt],
                                ],
                            ],
                        ],
                        'generationConfig' => [
                            'temperature' => 0.2,
                            'maxOutputTokens' => 128,
                        ],
                    ]);

                if (!$response->successful()) {
                    Log::warning('Gemini core focus request failed.', [
                        'model' => $model,
                        'status' => $response->status(),
                        'body' => $response->body(),
                    ]);

                    // If model not found/not supported, continue with next fallback model.
                    if ($response->status() === 404) {
                        continue;
                    }

                    return $this->buildHeuristicFallback($title, $abstract, $metadata);
                }

                /** @var array<string, mixed> $payload */
                $payload = $response->json();
                $text = data_get($payload, 'candidates.0.content.parts.0.text');
                if (!is_string($text)) {
                    continue;
                }

                $clean = trim(preg_replace('/\s+/', ' ', $text) ?? '');
                if ($clean !== '') {
                    return $this->normalizeToThreeWords($clean);
                }
            }

            return $this->buildHeuristicFallback($title, $abstract, $metadata);
        } catch (\Throwable $e) {
            Log::warning('Gemini core focus generation error.', ['message' => $e->getMessage()]);
            return $this->buildHeuristicFallback($title, $abstract, $metadata);
        }
    }

    /**
     * @return array<int, string>
     */
    private function buildModelCandidates(): array
    {
        $configured = (string) config('services.gemini.model', 'gemini-2.0-flash');
        $fallback = config('services.gemini.fallback_models', [
            'gemini-2.0-flash',
            'gemini-2.0-flash-lite',
            'gemini-1.5-flash-latest',
            'gemini-1.5-pro-latest',
        ]);

        $candidates = [$configured];
        if (is_array($fallback)) {
            foreach ($fallback as $model) {
                if (is_string($model) && trim($model) !== '') {
                    $candidates[] = trim($model);
                }
            }
        }

        return array_values(array_unique($candidates));
    }

    private function buildSourceText(?string $title, ?string $abstract, ?array $metadata = null): string
    {
        $parts = [];

        if (is_string($title) && trim($title) !== '') {
            $parts[] = 'Judul: ' . trim($title);
        }

        if (is_string($abstract) && trim($abstract) !== '') {
            $parts[] = 'Abstrak: ' . trim($abstract);
        }

        if (is_array($metadata)) {
            $metaFragments = [];
            foreach (['venue', 'journal', 'conference', 'booktitle', 'keywords', 'summary'] as $key) {
                $value = $metadata[$key] ?? null;
                if (is_string($value) && trim($value) !== '') {
                    $metaFragments[] = $key . ': ' . trim($value);
                }
                if (is_array($value) && $value !== []) {
                    $flat = array_values(array_filter(array_map(static fn ($item): string => is_scalar($item) ? trim((string) $item) : '', $value)));
                    if ($flat !== []) {
                        $metaFragments[] = $key . ': ' . implode(', ', $flat);
                    }
                }
            }

            if ($metaFragments !== []) {
                $parts[] = 'Metadata: ' . implode('; ', $metaFragments);
            }
        }

        return trim(implode("\n", $parts));
    }

    private function buildHeuristicFallback(?string $title, ?string $abstract, ?array $metadata = null): ?string
    {
        $titleText = is_string($title) ? trim($title) : '';
        $abstractText = is_string($abstract) ? trim($abstract) : '';

        if ($abstractText !== '') {
            $candidate = trim(preg_replace('/\s+/', ' ', $abstractText) ?? '');
            if ($candidate !== '') {
                return $this->normalizeToThreeWords($candidate);
            }
        }

        if ($titleText !== '') {
            return $this->normalizeToThreeWords($titleText);
        }

        if (is_array($metadata)) {
            foreach (['summary', 'keywords', 'journal', 'conference', 'booktitle'] as $key) {
                $value = $metadata[$key] ?? null;
                if (is_string($value) && trim($value) !== '') {
                    return $this->normalizeToThreeWords(trim($value));
                }
                if (is_array($value) && $value !== []) {
                    $flat = array_values(array_filter(array_map(static fn ($item): string => is_scalar($item) ? trim((string) $item) : '', $value)));
                    if ($flat !== []) {
                        return $this->normalizeToThreeWords(implode(' ', $flat));
                    }
                }
            }
        }

        return null;
    }

    private function normalizeToThreeWords(string $text): ?string
    {
        $clean = mb_strtolower($text);
        $clean = preg_replace('/[^[:alnum:]\s-]/u', ' ', $clean) ?? '';
        $clean = preg_replace('/\s+/', ' ', trim($clean)) ?? '';
        if ($clean === '') {
            return null;
        }

        $stopwords = [
            'dan', 'yang', 'untuk', 'pada', 'dengan', 'dari', 'dalam', 'terhadap', 'melalui', 'berbasis',
            'the', 'and', 'for', 'with', 'from', 'into', 'using', 'based', 'toward', 'towards', 'study',
        ];

        $tokens = array_values(array_filter(explode(' ', $clean), static function (string $token) use ($stopwords): bool {
            if (mb_strlen($token) < 3) {
                return false;
            }
            return !in_array($token, $stopwords, true);
        }));

        if ($tokens === []) {
            $tokens = array_values(array_filter(explode(' ', $clean), static fn (string $token): bool => mb_strlen($token) >= 3));
        }

        if ($tokens === []) {
            return null;
        }

        $selected = array_slice($tokens, 0, 3);
        $phrase = implode(' ', $selected);
        $phrase = preg_replace('/\s+/', ' ', trim($phrase)) ?? '';

        return $phrase !== '' ? mb_substr($phrase, 0, 120) : null;
    }
}
