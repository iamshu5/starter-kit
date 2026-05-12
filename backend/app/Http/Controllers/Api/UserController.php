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
        $users = $userService->paginate(
            perPage: (int) $request->get('per_page', 15),
            search:  $request->get('search'),
            sortBy:  $request->get('sort_by', 'created_at'),
            sortDir: $request->get('sort_dir', 'desc'),
        );

        return ApiResponse::paginated($users);
    }

    public function store(StoreUserRequest $request, UserService $userService): JsonResponse
    {
        $user = $userService->create($request->validated());
        return ApiResponse::success($user->load('role'), 'User created successfully', 201);
    }

    public function show(User $user): JsonResponse
    {
        return ApiResponse::success($user->load('role'));
    }

    public function update(UpdateUserRequest $request, User $user, UserService $userService): JsonResponse
    {
        $user = $userService->update($user, $request->validated());
        return ApiResponse::success($user, 'User updated successfully');
    }

    public function destroy(User $user, UserService $userService): JsonResponse
    {
        $userService->delete($user);
        return ApiResponse::success(null, 'User deleted successfully');
    }
}
