<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function register(RegisterRequest $request, AuthService $authService): JsonResponse
    {
        $authService->register($request->validated());
        return ApiResponse::success(null, 'Registrasi berhasil. Akun Anda menunggu aktivasi dari Admin.', 201);
    }

    public function login(LoginRequest $request, AuthService $authService): JsonResponse
    {
        try {
            $result = $authService->login($request->validated());
            return ApiResponse::success($result, 'Login successful');
        } catch (\InvalidArgumentException $e) {
            return ApiResponse::error($e->getMessage(), 422);
        }
    }

    public function logout(Request $request, AuthService $authService): JsonResponse
    {
        $authService->logout($request->user());
        return ApiResponse::success(null, 'Logged out successfully');
    }

    public function me(Request $request, AuthService $authService): JsonResponse
    {
        $user = $authService->me($request->user());
        return ApiResponse::success($user);
    }

    public function updateProfile(UpdateProfileRequest $request, AuthService $authService): JsonResponse
    {
        try {
            $user = $authService->updateProfile($request->user(), $request->validated());
            return ApiResponse::success($user, 'Profil berhasil diperbarui');
        } catch (\InvalidArgumentException $e) {
            return ApiResponse::error($e->getMessage(), 422);
        }
    }
}
