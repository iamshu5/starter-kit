<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function login(LoginRequest $request, AuthService $authService): JsonResponse
    {
        try {
            $result = $authService->login($request->validated());
            return ApiResponse::success($result, 'Login successful');
        } catch (\InvalidArgumentException $e) {
            return ApiResponse::error($e->getMessage(), 401);
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
}
