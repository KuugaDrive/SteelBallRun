<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ScimagoQuartileService
{
    public const UPLOADED_RELATIVE_PATH = 'scimago/scimagojr.csv';

    /** @var array<string, string>|null */
    private ?array $issnToQuartileMap = null;

    public function resolveQuartileByIssn(?string $issn): ?string
    {
        $normalizedIssn = $this->normalizeIssnToken($issn);
        if ($normalizedIssn === '') {
            $this->debugLog('resolve skipped: empty ISSN after normalization', ['issn' => $issn]);
            return null;
        }

        $map = $this->getIssnToQuartileMap();
        if ($map === []) {
            $this->debugLog('resolve failed: SCImago map is empty', ['issn_normalized' => $normalizedIssn]);
            return null;
        }

        $quartile = $map[$normalizedIssn] ?? null;
        if ($quartile === null) {
            $this->debugLog('resolve miss: ISSN not found in SCImago map', ['issn_normalized' => $normalizedIssn]);
        } else {
            $this->debugLog('resolve hit: ISSN matched SCImago quartile', [
                'issn_normalized' => $normalizedIssn,
                'quartile' => $quartile,
            ]);
        }

        return $quartile;
    }

    /**
     * @return array<string, string>
     */
    private function getIssnToQuartileMap(): array
    {
        if (is_array($this->issnToQuartileMap)) {
            return $this->issnToQuartileMap;
        }

        $csvPath = $this->resolveActiveCsvPath();
        if ($csvPath === '' || !is_file($csvPath) || !is_readable($csvPath)) {
            $this->debugLog('map init failed: csv path missing or unreadable', ['csv_path' => $csvPath]);
            $this->issnToQuartileMap = [];
            return $this->issnToQuartileMap;
        }

        $handle = fopen($csvPath, 'rb');
        if ($handle === false) {
            $this->debugLog('map init failed: cannot open csv file', ['csv_path' => $csvPath]);
            $this->issnToQuartileMap = [];
            return $this->issnToQuartileMap;
        }

        $firstLine = fgets($handle);
        if ($firstLine === false) {
            fclose($handle);
            $this->debugLog('map init failed: csv file empty', ['csv_path' => $csvPath]);
            $this->issnToQuartileMap = [];
            return $this->issnToQuartileMap;
        }

        $delimiter = $this->detectCsvDelimiter($firstLine);
        $header = str_getcsv(trim($firstLine), $delimiter);
        if (!is_array($header)) {
            fclose($handle);
            $this->debugLog('map init failed: csv header missing', ['csv_path' => $csvPath]);
            $this->issnToQuartileMap = [];
            return $this->issnToQuartileMap;
        }

        $issnIndex = $this->findHeaderIndex($header, ['issn']);
        $quartileIndex = $this->findHeaderIndex($header, ['sjr best quartile', 'quartile']);
        if ($issnIndex === null || $quartileIndex === null) {
            fclose($handle);
            $this->debugLog('map init failed: required columns not found', [
                'csv_path' => $csvPath,
                'header' => $header,
            ]);
            $this->issnToQuartileMap = [];
            return $this->issnToQuartileMap;
        }

        $map = [];
        while (($row = fgetcsv($handle, 0, $delimiter)) !== false) {
            if (!is_array($row)) {
                continue;
            }

            $rawIssnCell = isset($row[$issnIndex]) ? (string) $row[$issnIndex] : '';
            $rawQuartile = isset($row[$quartileIndex]) ? trim((string) $row[$quartileIndex]) : '';
            if ($rawIssnCell === '' || $rawQuartile === '') {
                continue;
            }

            foreach ($this->extractIssnTokensFromCell($rawIssnCell) as $token) {
                // Keep first seen quartile for stable mapping.
                if (!isset($map[$token])) {
                    $map[$token] = $rawQuartile;
                }
            }
        }

        fclose($handle);
        $this->issnToQuartileMap = $map;
        $this->debugLog('map init success', [
            'csv_path' => $csvPath,
            'issn_count' => count($map),
            'delimiter' => $delimiter,
            'source' => $this->getActiveCsvInfo()['source'],
        ]);
        return $this->issnToQuartileMap;
    }

    private function detectCsvDelimiter(string $line): string
    {
        $candidates = [',', ';', "\t", '|'];
        $bestDelimiter = ',';
        $bestCount = -1;

        foreach ($candidates as $candidate) {
            $count = substr_count($line, $candidate);
            if ($count > $bestCount) {
                $bestCount = $count;
                $bestDelimiter = $candidate;
            }
        }

        return $bestDelimiter;
    }

    public function resetCache(): void
    {
        $this->issnToQuartileMap = null;
    }

    /**
     * @return array{source:string,path:string|null,filename:string|null,last_modified:string|null}
     */
    public function getActiveCsvInfo(): array
    {
        $uploadedPath = $this->getUploadedAbsolutePath();
        if (Storage::disk('local')->exists(self::UPLOADED_RELATIVE_PATH) && $uploadedPath !== '' && is_readable($uploadedPath)) {
            return [
                'source' => 'uploaded',
                'path' => $uploadedPath,
                'filename' => basename($uploadedPath),
                'last_modified' => date('Y-m-d H:i:s', filemtime($uploadedPath) ?: time()),
            ];
        }

        $configuredPath = (string) config('services.scimago.csv_path', '');
        if ($configuredPath !== '' && is_file($configuredPath) && is_readable($configuredPath)) {
            return [
                'source' => 'env',
                'path' => $configuredPath,
                'filename' => basename($configuredPath),
                'last_modified' => date('Y-m-d H:i:s', filemtime($configuredPath) ?: time()),
            ];
        }

        return [
            'source' => 'none',
            'path' => null,
            'filename' => null,
            'last_modified' => null,
        ];
    }

    private function resolveActiveCsvPath(): string
    {
        $uploadedPath = $this->getUploadedAbsolutePath();
        if (Storage::disk('local')->exists(self::UPLOADED_RELATIVE_PATH) && $uploadedPath !== '' && is_readable($uploadedPath)) {
            return $uploadedPath;
        }

        return (string) config('services.scimago.csv_path', '');
    }

    private function getUploadedAbsolutePath(): string
    {
        try {
            return Storage::disk('local')->path(self::UPLOADED_RELATIVE_PATH);
        } catch (\Throwable) {
            return '';
        }
    }

    /**
     * @param array<int, string> $header
     * @param array<int, string> $candidates
     */
    private function findHeaderIndex(array $header, array $candidates): ?int
    {
        $normalizedHeader = array_map(
            static fn($value): string => trim(strtolower((string) $value)),
            $header
        );

        foreach ($candidates as $candidate) {
            $index = array_search(strtolower($candidate), $normalizedHeader, true);
            if ($index !== false) {
                return (int) $index;
            }
        }

        return null;
    }

    /**
     * @return array<int, string>
     */
    private function extractIssnTokensFromCell(string $value): array
    {
        $parts = preg_split('/[,;]+/', $value) ?: [];
        $tokens = [];
        foreach ($parts as $part) {
            $token = $this->normalizeIssnToken($part);
            if ($token !== '') {
                $tokens[] = $token;
            }
        }
        return array_values(array_unique($tokens));
    }

    private function normalizeIssnToken(?string $value): string
    {
        if (!is_string($value)) {
            return '';
        }

        $normalized = strtoupper($value);
        $normalized = preg_replace('/[^0-9X]/', '', $normalized) ?? '';
        return $normalized;
    }

    /**
     * @param array<string, mixed> $context
     */
    private function debugLog(string $message, array $context = []): void
    {
        if (!(bool) config('services.scimago.debug', false)) {
            return;
        }
        Log::info('[SCIMAGO] ' . $message, $context);
    }
}
