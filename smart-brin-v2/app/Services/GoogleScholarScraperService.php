<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use RuntimeException;
use Symfony\Component\Process\Exception\ProcessTimedOutException;
use Symfony\Component\Process\Process;

class GoogleScholarScraperService
{
    /**
     * @return array<int, array<string, mixed>>
     */
    public function scrapeByAuthorAndYear(string $authorName, string $scholarId, int $year): array
    {
        $pythonBinary = (string) config('services.scraper.python_bin', env('SCRAPER_PYTHON_BIN', 'python'));
        $timeoutSeconds = (int) config('services.scraper.timeout_seconds', env('SCRAPER_TIMEOUT_SECONDS', 1200));
        $debugIssn = (bool) config('services.scraper.debug_issn', false);
        if ($timeoutSeconds <= 0) {
            $timeoutSeconds = 1200;
        }
        $scriptPath = base_path('scripts/scrape_google_scholar.py');
        $processEnv = $this->buildProcessEnvironment();

        $command = [
            $pythonBinary,
            $scriptPath,
            '--author-name',
            $authorName,
            '--scholar-id',
            $scholarId,
            '--year',
            (string) $year,
        ];
        if ($debugIssn) {
            $command[] = '--debug-issn';
        }

        $process = new Process($command, base_path(), $processEnv, null, $timeoutSeconds);
        if ($debugIssn) {
            Log::info('Running scraper with ISSN debug enabled', [
                'author' => $authorName,
                'scholar_id' => $scholarId,
                'year' => $year,
            ]);
        }

        try {
            $process->run();
        } catch (ProcessTimedOutException $e) {
            throw new RuntimeException(
                sprintf(
                    'Proses scraping timeout setelah %d detik. Coba ulangi atau naikkan SCRAPER_TIMEOUT_SECONDS.',
                    $timeoutSeconds
                ),
                previous: $e
            );
        } catch (\Throwable $e) {
            throw new RuntimeException('Proses scraping gagal dijalankan: ' . $e->getMessage(), previous: $e);
        }

        if (!$process->isSuccessful()) {
            $errorOutput = trim($process->getErrorOutput());
            $stdOutput = trim($process->getOutput());
            $message = $errorOutput !== '' ? $errorOutput : $stdOutput;
            throw new RuntimeException($message !== '' ? $message : 'Proses scraping gagal dijalankan.');
        }

        if ($debugIssn) {
            $stderr = trim($process->getErrorOutput());
            if ($stderr !== '') {
                Log::info('ISSN debug output from scraper', [
                    'author' => $authorName,
                    'scholar_id' => $scholarId,
                    'year' => $year,
                    'stderr' => $stderr,
                ]);
            }
        }

        $output = trim($process->getOutput());
        if ($output === '') {
            return [];
        }

        /** @var mixed $decoded */
        $decoded = json_decode($output, true);

        if (!is_array($decoded)) {
            throw new RuntimeException('Output scraper tidak valid (bukan JSON array).');
        }

        return array_values(array_filter($decoded, static fn($row): bool => is_array($row)));
    }

    /**
     * Ensure Python process spawned from web server has required Windows env vars.
     *
     * @return array<string, string>
     */
    private function buildProcessEnvironment(): array
    {
        $env = [];

        $systemRoot = getenv('SystemRoot') ?: getenv('WINDIR') ?: 'C:\\Windows';
        $windir = getenv('WINDIR') ?: $systemRoot;
        $path = getenv('PATH') ?: '';

        $env['SystemRoot'] = $systemRoot;
        $env['WINDIR'] = $windir;
        $env['PATH'] = $path;
        $env['PYTHONIOENCODING'] = 'utf-8';

        foreach (['APPDATA', 'LOCALAPPDATA', 'USERPROFILE'] as $userVar) {
            $val = getenv($userVar);
            if ($val !== false && $val !== null && $val !== '') {
                $env[$userVar] = (string) $val;
            }
        }

        foreach (['HTTP_PROXY', 'HTTPS_PROXY', 'ALL_PROXY', 'NO_PROXY'] as $proxyVar) {
            $proxyValue = getenv($proxyVar);
            if ($proxyValue !== false && $proxyValue !== null && $proxyValue !== '') {
                $env[$proxyVar] = (string) $proxyValue;
            }
        }

        return $env;
    }
}
