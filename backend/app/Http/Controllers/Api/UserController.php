<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\User;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request, UserService $userService): JsonResponse
    {
        return ApiResponse::tryCatch(fn() =>
            ApiResponse::paginated($userService->paginate(
                perPage: (int) $request->get('per_page', 15),
                search:  $request->get('search'),
                sortBy:  $request->get('sort_by', 'created_at'),
                sortDir: $request->get('sort_dir', 'desc'),
            ))
        );
    }

    public function store(StoreUserRequest $request, UserService $userService): JsonResponse
    {
        return ApiResponse::tryCatch(
            fn() => ApiResponse::success($userService->create($request->validated())->load('role'), 'User created successfully', 201)
        );
    }

    public function show(User $user): JsonResponse
    {
        return ApiResponse::tryCatch(
            fn() => ApiResponse::success($user->load('role'))
        );
    }

    public function update(UpdateUserRequest $request, User $user, UserService $userService): JsonResponse
    {
        return ApiResponse::tryCatch(
            fn() => ApiResponse::success($userService->update($user, $request->validated()), 'User updated successfully')
        );
    }

    public function destroy(User $user, UserService $userService): JsonResponse
    {
        return ApiResponse::tryCatch(function () use ($user, $userService) {
            $userService->delete($user);
            return ApiResponse::success(null, 'User deleted successfully');
        });
    }
}
