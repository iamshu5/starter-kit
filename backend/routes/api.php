<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\MenuController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::get('/ping', fn () => response()->json(['ok' => true])->header('Cache-Control', 'no-store, no-cache'));

// Public
Route::middleware('throttle:10,1')->group(function () {
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/register', [AuthController::class, 'register']);
});

Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::prefix('/auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/refresh', [AuthController::class, 'refresh']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::patch('/profile', [AuthController::class, 'updateProfile']);
    });

    // Sidebar dan flat menus — dipake UI untuk semua role
    Route::prefix('/menus')->group(function () {
        Route::get('/flat', [MenuController::class, 'flat']);
        Route::get('/sidebar', [MenuController::class, 'sidebar']);
    });

    // List permissions — dipake di AssignModal
    Route::get('/permissions', [RoleController::class, 'permissions'])->middleware('permission:roles.view');

    // Users
    Route::prefix('/users')->group(function () {
        Route::get('/', [UserController::class, 'index'])->middleware('permission:users.view');
        Route::get('/{user}', [UserController::class, 'show'])->middleware('permission:users.view');
        Route::post('/', [UserController::class, 'store'])->middleware('permission:users.create');
        Route::put('/{user}', [UserController::class, 'update'])->middleware('permission:users.update');
        Route::patch('/{user}', [UserController::class, 'update'])->middleware('permission:users.update');
        Route::delete('/{user}', [UserController::class, 'destroy'])->middleware('permission:users.delete');
    });

    // Roles
    Route::prefix('/roles')->group(function () {
        Route::get('/', [RoleController::class, 'index'])->middleware('permission:roles.view');
        Route::get('/{role}', [RoleController::class, 'show'])->middleware('permission:roles.view');
        Route::post('/', [RoleController::class, 'store'])->middleware('permission:roles.create');
        Route::put('/{role}', [RoleController::class, 'update'])->middleware('permission:roles.update');
        Route::patch('/{role}', [RoleController::class, 'update'])->middleware('permission:roles.update');
        Route::delete('/{role}', [RoleController::class, 'destroy'])->middleware('permission:roles.delete');
        Route::post('/{role}/permissions', [RoleController::class, 'syncPermissions'])->middleware('permission:roles.update');
        Route::post('/{role}/menus', [RoleController::class, 'syncMenus'])->middleware('permission:roles.update');
    });

    // Menus
    Route::prefix('/menus')->group(function () {
        Route::get('/', [MenuController::class, 'index'])->middleware('permission:menus.view');
        Route::get('/{menu}', [MenuController::class, 'show'])->middleware('permission:menus.view');
        Route::post('/', [MenuController::class, 'store'])->middleware('permission:menus.create');
        Route::put('/{menu}', [MenuController::class, 'update'])->middleware('permission:menus.update');
        Route::patch('/{menu}', [MenuController::class, 'update'])->middleware('permission:menus.update');
        Route::delete('/{menu}', [MenuController::class, 'destroy'])->middleware('permission:menus.delete');
    });
});
