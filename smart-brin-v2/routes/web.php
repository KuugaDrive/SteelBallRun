<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DetailController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\TargetTahunanController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\UserManagementController;
use App\Http\Controllers\AdminMasterDataController;
use App\Http\Controllers\ScrappingController;
use App\Http\Controllers\Api\DocumentStoreController;
use App\Models\User;

Route::get('/', function () {
    return Inertia::render('landingpage');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {

    // ==============================================
    // DASHBOARD
    // ==============================================
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');


    // ==============================================
    // CRUD DETAILS
    // ==============================================
    Route::get('/details', [DetailController::class, 'index'])->name('details');
    Route::post('/details/{type}/{id}/stamp', [DetailController::class, 'stamp'])->name('details.stamp');
    Route::patch('/details/update/{type}/{id}', [DetailController::class, 'update'])->name('details.update');
    Route::delete('/details/destroy/{type}/{id}', [DetailController::class, 'destroy'])->name('details.destroy');


    // ==============================================
    // TARGET TAHUNAN
    // ==============================================
    Route::get('/target-tahunan', [TargetTahunanController::class, 'index'])->name('target-tahunan.index');
    Route::post('/target-tahunan', [TargetTahunanController::class, 'store'])->name('target-tahunan.store');
    Route::get('/target-tahunan/edit/{id}', [TargetTahunanController::class, 'edit'])->name('target-tahunan.edit');
    Route::put('/target-tahunan/update/{id}', [TargetTahunanController::class, 'update'])->name('target-tahunan.update');
    Route::delete('/target-tahunan/delete/{id}', [TargetTahunanController::class, 'destroy'])->name('target-tahunan.destroy');

    // ==============================================
    // LAPORAN CAPAIAN
    // ==============================================
    Route::get('/report-capaian', [ReportController::class, 'index'])->name('report-capaian.index');
    Route::get('/report-capaian/export', [ReportController::class, 'export'])->name('report-capaian.export');


    // ==============================================
    // USER MANAGEMENT
    // ==============================================
    Route::middleware('can:manageUsers,' . User::class)->group(function () {
        Route::get('/users', [UserManagementController::class, 'index'])->name('users.index');
        Route::post('/users', [UserManagementController::class, 'store'])->name('users.store');
        Route::put('/users/{user}', [UserManagementController::class, 'update'])->name('users.update');
        Route::put('/users/{user}/unit-kerja', [UserManagementController::class, 'updateUnitKerja'])->name('users.updateUnitKerja');
        Route::put('/users/{user}/role', [UserManagementController::class, 'updateRole'])->name('users.updateRole');
        Route::delete('/users/{user}', [UserManagementController::class, 'destroy'])->name('users.destroy');
    });

    // ==============================================
    // ADMIN MASTER DATA (ADMIN / SUPERADMIN)
    // ==============================================
    Route::middleware('can:manageAdminTables,' . User::class)->group(function () {
        Route::get('/admin/master-data', [AdminMasterDataController::class, 'index'])->name('admin.master-data.index');

        Route::post('/admin/master-data/organisasi-riset', [AdminMasterDataController::class, 'storeOrganisasiRiset'])->name('admin.master-data.organisasi.store');
        Route::put('/admin/master-data/organisasi-riset/{organisasi}', [AdminMasterDataController::class, 'updateOrganisasiRiset'])->name('admin.master-data.organisasi.update');
        Route::delete('/admin/master-data/organisasi-riset/{organisasi}', [AdminMasterDataController::class, 'destroyOrganisasiRiset'])->name('admin.master-data.organisasi.destroy');

        Route::middleware('can:manageUnitKerja,' . User::class)->group(function () {
            Route::post('/admin/master-data/unit-kerja', [AdminMasterDataController::class, 'storeUnitKerja'])->name('admin.master-data.unit.store');
            Route::put('/admin/master-data/unit-kerja/{unit}', [AdminMasterDataController::class, 'updateUnitKerja'])->name('admin.master-data.unit.update');
            Route::delete('/admin/master-data/unit-kerja/{unit}', [AdminMasterDataController::class, 'destroyUnitKerja'])->name('admin.master-data.unit.destroy');
        });

        Route::post('/admin/master-data/kelompok-riset', [AdminMasterDataController::class, 'storeKelompokRiset'])->name('admin.master-data.kelompok.store');
        Route::put('/admin/master-data/kelompok-riset/{kelompok}', [AdminMasterDataController::class, 'updateKelompokRiset'])->name('admin.master-data.kelompok.update');
        Route::delete('/admin/master-data/kelompok-riset/{kelompok}', [AdminMasterDataController::class, 'destroyKelompokRiset'])->name('admin.master-data.kelompok.destroy');
    });

    Route::middleware('can:manageScraping,' . User::class)->group(function () {
        Route::get('/admin/scrapping', [ScrappingController::class, 'index'])->name('admin.scrapping.index');
        Route::post('/admin/scrapping/scimago-csv/upload', [ScrappingController::class, 'uploadScimagoCsv'])->name('admin.scrapping.scimago-csv.upload');
        Route::delete('/admin/scrapping/scimago-csv/delete', [ScrappingController::class, 'deleteScimagoCsv'])->name('admin.scrapping.scimago-csv.delete');
        Route::post('/admin/scrapping/start', [ScrappingController::class, 'start'])->name('admin.scrapping.start');
        Route::post('/admin/scrapping/results', [ScrappingController::class, 'results'])->name('admin.scrapping.results');
        Route::post('/admin/scrapping/manual-reclassify-pub-type', [ScrappingController::class, 'manualReclassifyPubType'])
            ->name('admin.scrapping.manual-reclassify-pub-type');
        Route::post('/admin/scrapping/backfill-ai-core-focus', [ScrappingController::class, 'backfillAiCoreFocus'])
            ->name('admin.scrapping.backfill-ai-core-focus');
        Route::post('/admin/scrapping/map-data', [ScrappingController::class, 'mapDataToPublication'])->name('admin.scrapping.map-data');
    });


    // ==============================================
    // LLM UPLOAD DOCUMENTS
    // ==============================================
    Route::get('/upload-documents', function () {
        return Inertia::render('llm');
    });
    Route::post('/api/save-document', [DocumentStoreController::class, 'store'])->middleware(['auth']);

    // Route::get('/users', function () {
    // return Inertia::render('accountmanagement');
    // });



});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
