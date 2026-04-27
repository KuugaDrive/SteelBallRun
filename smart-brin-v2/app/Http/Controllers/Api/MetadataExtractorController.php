<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Partitech\PhpMistral\MistralClient;
use Partitech\PhpMistral\Messages;
use Spatie\PdfToText\Pdf;
use Exception;
use App\Services\PromptService; 
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class MetadataExtractorController extends Controller
{
    /**
     * Handle the metadata extraction request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Services\PromptService  $promptService
     * @return \Illuminate\Http\JsonResponse
     */
    public function extract(Request $request, PromptService $promptService) 
    {

    Log::info('PHP upload settings', [
        'upload_max_filesize' => ini_get('upload_max_filesize'),
        'post_max_size' => ini_get('post_max_size'),
    ]);
    Log::info('Request files', ['files' => $request->allFiles()]);
    Log::info('Request hasFile', ['has_file' => $request->hasFile('file')]);
    
    set_time_limit(180);
        set_time_limit(180);
        ini_set('memory_limit', '512M');

        try {
            $request->validate([
                'file' => 'required|file|mimes:pdf|max:10240',
                'documentKey' => 'required|string',
            ]);

            $file = $request->file('file');
            $documentKey = $request->input('documentKey');

            // Use PDFco for PDF text extraction
            $textFromPdf = $this->extractTextFromPdfUsingPdfCo($file);
            
            $textFromPdf = mb_substr($textFromPdf, 0, 20000);

            // Memanggil prompt dari service, bukan dari controller ini
            $prompt = $promptService->createPromptForDocument($documentKey, $textFromPdf);

            if (!$prompt) {
                return response()->json(['error' => 'Invalid document key provided.'], 400);
            }

            $apiKey = env('MISTRAL_API_KEY');
            if (empty($apiKey)) {
                return response()->json(['error' => 'MISTRAL_API_KEY is not set in the .env file.'], 500);
            }

            $client = new MistralClient($apiKey);
            $messages = (new Messages())->addUserMessage($prompt);
            $params = [
                'model' => 'mistral-large-latest',
                'response_format' => ['type' => 'json_object'],
            ];

            $startTime = microtime(true);

            $response = $client->chat($messages, $params);

            $endTime = microtime(true);
            $duration = round($endTime - $startTime, 2);

            if (isset($response->error)) {
                $errorMessage = "Mistral API Error: " . ($response->error->message ?? 'Unknown error');
                throw new Exception($errorMessage);
            }
            
            Log::info("Ekstraksi metadata (Mistral) berhasil untuk '{$documentKey}'. Durasi: {$duration} detik.");

            $choices = $response->getChoices();

            if (empty($choices[0]->getContent())) {
                 throw new Exception('Invalid response structure from Mistral API. The response might not contain the expected content.');
            }

            $jsonOutput = $choices[0]->getContent();
            $metadata = json_decode($jsonOutput, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new Exception('Failed to decode JSON from Mistral response. Raw content: ' . $jsonOutput);
            }

            return response()->json([
                'metadata' => $metadata
            ]);

        } catch (Exception $e) {
            return response()->json([
                'error' => 'An exception occurred on the server.',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Ekstrak teks dari PDF menggunakan PDF.co API
     *
     * @param \Illuminate\Http\UploadedFile $file
     * @return string
     * @throws Exception
     */
    private function extractTextFromPdfUsingPdfCo($file)
    {
        $apiKey = env('PDFCO_API_KEY');
        if (empty($apiKey)) {
            throw new Exception('PDFCO_API_KEY is not set in the .env file.');
        }

        try {
            $presignedResponse = $this->makeHttpRequestWithRetry(function() use ($apiKey, $file) {
                return Http::timeout(60)
                    ->connectTimeout(30)
                    ->withHeaders([
                        'x-api-key' => $apiKey,
                    ])->get('https://api.pdf.co/v1/file/upload/get-presigned-url', [
                        'name' => $file->getClientOriginalName(),
                        'contenttype' => 'application/pdf'
                    ]);
            }, 'get presigned URL'); 

            if (!$presignedResponse->successful()) {
                $statusCode = $presignedResponse->status();
                $errorBody = $presignedResponse->body();
                Log::error("PDF.co presigned URL request failed. Status: {$statusCode}, Body: {$errorBody}");
                throw new Exception("Failed to get presigned URL from PDF.co (HTTP {$statusCode}): {$errorBody}");
            }

            $presignedData = $presignedResponse->json();
            $uploadUrl = $presignedData['presignedUrl'];
            $uploadedFileUrl = $presignedData['url'];

            Log::info('PDF.co presigned URL obtained: ' . $uploadedFileUrl);

            $uploadResponse = $this->makeHttpRequestWithRetry(function() use ($uploadUrl, $file) {
                $curl = curl_init();
                curl_setopt_array($curl, [
                    CURLOPT_URL => $uploadUrl,
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_CUSTOMREQUEST => 'PUT',
                    CURLOPT_POSTFIELDS => file_get_contents($file->getRealPath()),
                    CURLOPT_HTTPHEADER => [
                        'Content-Type: application/pdf',
                        'Content-Length: ' . $file->getSize()
                    ],
                    CURLOPT_TIMEOUT => 120,
                    CURLOPT_CONNECTTIMEOUT => 30,
                ]);
                
                $response = curl_exec($curl);
                $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
                $error = curl_error($curl);
                curl_close($curl);
                
                if ($error) {
                    throw new Exception("cURL error: {$error}");
                }
                
                return new class($httpCode, $response) {
                    private $status;
                    private $body;
                    
                    public function __construct($status, $body) {
                        $this->status = $status;
                        $this->body = $body;
                    }
                    
                    public function successful() {
                        return $this->status >= 200 && $this->status < 300;
                    }
                    
                    public function status() {
                        return $this->status;
                    }
                    
                    public function body() {
                        return $this->body;
                    }
                };
            }, 'upload file to presigned URL');

            if (!$uploadResponse->successful()) {
                $statusCode = $uploadResponse->status();
                $errorBody = $uploadResponse->body();
                Log::error("PDF.co file upload failed. Status: {$statusCode}, Body: {$errorBody}");
                throw new Exception("Failed to upload file to PDF.co presigned URL (HTTP {$statusCode}): {$errorBody}");
            }

            Log::info('File successfully uploaded to PDF.co');

            $convertResponse = $this->makeHttpRequestWithRetry(function() use ($apiKey, $uploadedFileUrl) {
                return Http::timeout(180)
                    ->connectTimeout(30)
                    ->withHeaders([
                        'x-api-key' => $apiKey,
                        'Content-Type' => 'application/json',
                    ])->post('https://api.pdf.co/v1/pdf/convert/to/text', [
                        'url' => $uploadedFileUrl,
                        'async' => false,
                        // jika ingin batasi halaman, bisa tambahkan 'pages' => '1-5' atau 'pages' => '1,3,5'
                    ]);
            }, 'convert PDF to text');

            if (!$convertResponse->successful()) {
                $statusCode = $convertResponse->status();
                $errorBody = $convertResponse->body();
                Log::error("PDF.co convert API failed. Status: {$statusCode}, Body: {$errorBody}");
                throw new Exception("Failed to convert PDF to text (HTTP {$statusCode}): {$errorBody}");
            }

            $convertData = $convertResponse->json();
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                Log::error('PDF.co convert API Response JSON decode error: ' . json_last_error_msg());
                Log::error('Raw response: ' . $convertResponse->body());
                throw new Exception('Failed to decode JSON response from PDF.co convert API');
            }
            
            Log::info('PDF.co convert API Response: ', $convertData);
            
            if (isset($convertData['error']) && !$convertData['error']) {
                if (isset($convertData['url'])) {
                    $resultFileUrl = $convertData['url'];
                    
                    $textResponse = Http::timeout(60)->connectTimeout(30)->get($resultFileUrl);
                    if ($textResponse->successful()) {
                        $textContent = $textResponse->body();
                        
                        Log::info('Raw text sample from PDF.co (first 200 chars): ' . substr($textContent, 0, 200));
                        
                        Log::info('Text successfully extracted from PDF using PDF.co. Length: ' . strlen($textContent));
                        return $textContent;
                    } else {
                        throw new Exception('Failed to download text content from PDF.co result URL');
                    }
                } elseif (isset($convertData['body'])) {
                    // Direct text in response
                    $textContent = $convertData['body'];
                    Log::info('Text successfully extracted from PDF using PDF.co. Length: ' . strlen($textContent));
                    return $textContent;
                } else {
                    Log::error('PDF.co convert API success but no text content or URL found: ', $convertData);
                    throw new Exception('PDF.co convert API returned success but no text content or result URL was found');
                }
            } else {
                // Error case
                $errorMessage = isset($convertData['message']) ? $convertData['message'] : 'Unknown error from PDF.co convert API';
                Log::error('PDF.co convert API Error: ', $convertData);
                throw new Exception('PDF.co convert API error: ' . $errorMessage);
            }

        } catch (Exception $e) {
            Log::error('Error dalam ekstraksi PDF menggunakan PDF.co: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            throw new Exception('Failed to extract text from PDF using PDF.co: ' . $e->getMessage());
        }
    }

    /**
     * Sanitasi text encoding untuk memastikan UTF-8 yang valid
     *
     * @param string $text
     * @return string
     */
    private function sanitizeTextEncoding($text)
    {
        // Simple and effective approach: keep only safe characters
        $text = preg_replace('/[^\x09\x0A\x0D\x20-\x7E]/', '', $text);
        
        // Clean whitespace
        $text = preg_replace('/[\r\n]+/', "\n", $text);
        $text = preg_replace('/[ \t]+/', ' ', $text);
        $text = preg_replace('/\n{3,}/', "\n\n", $text);
        
        return trim($text);
    }

    /**
     * Fallback sanitization - remove all non-ASCII characters
     *
     * @param string $text
     * @return string
     */
    private function fallbackSanitization($text)
    {
        // Keep only ASCII printable characters, newlines, and tabs
        $text = preg_replace('/[^\x09\x0A\x0D\x20-\x7E]/', '', $text);
        
        // Normalize whitespace
        $text = preg_replace('/[\r\n]+/', "\n", $text);
        $text = preg_replace('/[ \t]+/', ' ', $text);
        $text = preg_replace('/\n{3,}/', "\n\n", $text);
        
        return trim($text);
    }

    /**
     * Make HTTP request with retry mechanism
     *
     * @param callable $requestCallback
     * @param string $operation
     * @param int $maxRetries
     * @return \Illuminate\Http\Client\Response
     * @throws Exception
     */
    private function makeHttpRequestWithRetry($requestCallback, $operation, $maxRetries = 3)
    {
        $lastException = null;
        
        for ($attempt = 1; $attempt <= $maxRetries; $attempt++) {
            try {
                Log::info("Attempting {$operation} (attempt {$attempt}/{$maxRetries})");
                
                $response = $requestCallback();
                
                if ($response->successful()) {
                    Log::info("Successfully completed {$operation} on attempt {$attempt}");
                    return $response;
                }
                
                // If not successful but not a timeout, don't retry
                $statusCode = $response->status();
                if ($statusCode >= 400 && $statusCode < 500) {
                    throw new Exception("HTTP {$statusCode} error for {$operation}: " . $response->body());
                }
                
                Log::warning("HTTP {$statusCode} error for {$operation} on attempt {$attempt}, will retry...");
                
            } catch (Exception $e) {
                $lastException = $e;
                
                if (strpos($e->getMessage(), 'timeout') !== false || 
                    strpos($e->getMessage(), 'Failed to connect') !== false ||
                    strpos($e->getMessage(), 'cURL error 28') !== false) {
                    
                    Log::warning("Timeout/connection error for {$operation} on attempt {$attempt}: " . $e->getMessage());
                    
                    if ($attempt < $maxRetries) {
                        $delay = pow(2, $attempt - 1) * 2; 
                        Log::info("Waiting {$delay} seconds before retry...");
                        sleep($delay);
                        continue;
                    }
                } else {
                    throw $e;
                }
            }
        }
        
        throw new Exception("Failed to complete {$operation} after {$maxRetries} attempts. Last error: " . $lastException->getMessage());
    }

}