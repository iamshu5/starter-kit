<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\MenuController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

// Public
Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // Sidebar dan flat menus — dipake UI untuk semua role
    Route::get('/menus/flat', [MenuController::class, 'flat']);
    Route::get('/menus/sidebar', [MenuController::class, 'sidebar']);

    // List permissions — dipake di AssignModal
    Route::get('/permissions', [RoleController::class, 'permissions'])->middleware('permission:roles.view');

    // Users
    Route::get('/users', [UserController::class, 'index'])->middleware('permission:users.view');
    Route::get('/users/{user}', [UserController::class, 'show'])->middleware('permission:users.view');
    Route::post('/users', [UserController::class, 'store'])->middleware('permission:users.create');
    Route::put('/users/{user}', [UserController::class, 'update'])->middleware('permission:users.update');
    Route::patch('/users/{user}', [UserController::class, 'update'])->middleware('permission:users.update');
    Route::delete('/users/{user}', [UserController::class, 'destroy'])->middleware('permission:users.delete');

    // Roles
    Route::get('/roles', [RoleController::class, 'index'])->middleware('permission:roles.view');
    Route::get('/roles/{role}', [RoleController::class, 'show'])->middleware('permission:roles.view');
    Route::post('/roles', [RoleController::class, 'store'])->middleware('permission:roles.create');
    Route::put('/roles/{role}', [RoleController::class, 'update'])->middleware('permission:roles.update');
    Route::patch('/roles/{role}', [RoleController::class, 'update'])->middleware('permission:roles.update');
    Route::delete('/roles/{role}', [RoleController::class, 'destroy'])->middleware('permission:roles.delete');
    Route::post('/roles/{role}/permissions', [RoleController::class, 'syncPermissions'])->middleware('permission:roles.update');
    Route::post('/roles/{role}/menus', [RoleController::class, 'syncMenus'])->middleware('permission:roles.update');

    // Menus
    Route::get('/menus', [MenuController::class, 'index'])->middleware('permission:menus.view');
    Route::get('/menus/{menu}', [MenuController::class, 'show'])->middleware('permission:menus.view');
    Route::post('/menus', [MenuController::class, 'store'])->middleware('permission:menus.create');
    Route::put('/menus/{menu}', [MenuController::class, 'update'])->middleware('permission:menus.update');
    Route::patch('/menus/{menu}', [MenuController::class, 'update'])->middleware('permission:menus.update');
    Route::delete('/menus/{menu}', [MenuController::class, 'destroy'])->middleware('permission:menus.delete');
});
