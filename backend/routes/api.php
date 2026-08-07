<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\LocationController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\DuplicateGnAnalysisController;
use App\Http\Controllers\ExportController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\VerificationController;
use App\Http\Controllers\ApiLogController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\GuestTokenController;
use App\Http\Middleware\LogApiAccess;

/*
|--------------------------------------------------------------------------
| Public routes (logged)
|--------------------------------------------------------------------------
*/
Route::middleware([LogApiAccess::class])->group(function () {

    // Auth
    Route::post('/login', [AuthController::class, 'login']);

    // Public lookup remains unchanged in this phase.
    Route::get('/location-lookup',          [LocationController::class, 'lookup']);

    // Search
    Route::get('/search', [SearchController::class, 'search']);

    // Duplicate GN analysis (public read)
    Route::get('/duplicate-gn', [DuplicateGnAnalysisController::class, 'index']);

    // Exports (public)
    Route::get('/export/search/excel',       [ExportController::class, 'exportSearchExcel']);
    Route::get('/export/search/pdf',         [ExportController::class, 'exportSearchPdf']);
    Route::get('/export/listing/excel',      [ExportController::class, 'exportListingExcel']);
    Route::get('/export/listing/pdf',        [ExportController::class, 'exportListingPdf']);
    Route::get('/export/duplicate-gn/excel', [ExportController::class, 'exportDuplicateGnExcel']);
    Route::get('/export/duplicate-gn/pdf',   [ExportController::class, 'exportDuplicateGnPdf']);
});

/*
|--------------------------------------------------------------------------
| Versioned Sanctum API
|--------------------------------------------------------------------------
*/
Route::prefix('v1')->group(function () {
    Route::post('/auth/guest-token', [GuestTokenController::class, 'store'])
        ->middleware('throttle:10,1');

    Route::middleware(['auth:sanctum', 'abilities:location:read', LogApiAccess::class])
        ->prefix('locations')
        ->group(function () {
            Route::get('/provinces',               [LocationController::class, 'provinces']);
            Route::get('/districts',               [LocationController::class, 'districts']);
            Route::get('/divisional-secretariats', [LocationController::class, 'divisionalSecretariats']);
            Route::get('/gn-divisions',            [LocationController::class, 'gnDivisions']);
            Route::get('/villages',                [LocationController::class, 'villages']);
        });
});

/*
|--------------------------------------------------------------------------
| Authenticated routes
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', LogApiAccess::class])->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);

    // DS Officer verification
    Route::get('/verification/my-gn-divisions',      [VerificationController::class, 'myGnDivisions']);
    Route::get('/verification/gn/{gnId}/villages',   [VerificationController::class, 'gnVillages']);
    Route::put('/verification/gn/{gnId}',            [VerificationController::class, 'updateGn']);
    Route::put('/verification/village/{villageId}',  [VerificationController::class, 'updateVillage']);
    Route::post('/verification/draft',               [VerificationController::class, 'markDraft']);
    Route::post('/verification/final',               [VerificationController::class, 'markFinal']);

    // Admin only
    Route::middleware('can:admin')->group(function () {
        // Dashboard
        Route::get('/dashboard/stats',               [DashboardController::class, 'stats']);
        Route::get('/dashboard/verification-status', [DashboardController::class, 'verificationStatus']);
        Route::get('/dashboard/recent-logs',         [DashboardController::class, 'recentLogs']);

        // User management
        Route::get('/admin/users',          [AdminController::class, 'users']);
        Route::post('/admin/users',         [AdminController::class, 'createUser']);
        Route::put('/admin/users/{id}',     [AdminController::class, 'updateUser']);
        Route::delete('/admin/users/{id}',  [AdminController::class, 'deleteUser']);

        // Lock/unlock DS
        Route::post('/admin/ds/{dsId}/lock',   [VerificationController::class, 'lockDs']);
        Route::post('/admin/ds/{dsId}/unlock', [VerificationController::class, 'unlockDs']);

        // API logs
        Route::get('/admin/api-logs',         [ApiLogController::class, 'index']);
        Route::get('/admin/api-logs/summary', [ApiLogController::class, 'summary']);
    });
});
