<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'scraper' => [
        'python_bin' => env('SCRAPER_PYTHON_BIN', 'python'),
        'timeout_seconds' => (int) env('SCRAPER_TIMEOUT_SECONDS', 1200),
        'generate_core_focus_on_scrape' => filter_var(env('SCRAPER_GENERATE_CORE_FOCUS_ON_SCRAPE', false), FILTER_VALIDATE_BOOLEAN),
        'debug_issn' => filter_var(env('SCRAPER_DEBUG_ISSN', false), FILTER_VALIDATE_BOOLEAN),
    ],

    'gemini' => [
        'api_key' => env('GEMINI_API_KEY'),
        'model' => env('GEMINI_MODEL', 'gemini-2.0-flash'),
        'fallback_models' => array_filter(array_map('trim', explode(',', (string) env(
            'GEMINI_FALLBACK_MODELS',
            'gemini-2.0-flash,gemini-2.0-flash-lite,gemini-1.5-flash-latest,gemini-1.5-pro-latest'
        )))),
        'base_url' => env('GEMINI_BASE_URL', 'https://generativelanguage.googleapis.com/v1beta'),
    ],

    'scimago' => [
        'csv_path' => env('SCIMAGOJR_CSV_PATH'),
        'debug' => filter_var(env('SCIMAGO_DEBUG', false), FILTER_VALIDATE_BOOLEAN),
    ],

];
