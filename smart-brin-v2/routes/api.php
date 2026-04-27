<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\MetadataExtractorController;
use App\Http\Controllers\Api\DocumentStoreController;
use App\Http\Controllers\Api\UserSearchController;
use App\Http\Controllers\Api\MasterDataController;

Route::post('/extract-metadata', [MetadataExtractorController::class, 'extract']);
Route::post('/save-document', [DocumentStoreController::class, 'store']);
Route::get('/users/search', [UserSearchController::class, 'search']);
Route::get('/master/publikasi-types', [MasterDataController::class, 'getPublikasiTypes']);
