<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRoleRequest;
use App\Http\Requests\UpdateRoleRequest;
use App\Models\Role;
use App\Services\RoleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    public function index(Request $request, RoleService $roleService): JsonResponse
    {
        return ApiResponse::tryCatch(fn() =>
            ApiResponse::paginated($roleService->paginate(
                perPage: (int) $request->get('per_page', 15),
                search:  $request->get('search'),
                sortBy:  $request->get('sort_by', 'name'),
                sortDir: $request->get('sort_dir', 'asc'),
            ))
        );
    }

    public function store(StoreRoleRequest $request, RoleService $roleService): JsonResponse
    {
        return ApiResponse::tryCatch(
            fn() => ApiResponse::success($roleService->create($request->validated()), 'Role created successfully', 201)
        );
    }

    public function show(Role $role, RoleService $roleService): JsonResponse
    {
        return ApiResponse::tryCatch(
            fn() => ApiResponse::success($roleService->find($role->id))
        );
    }

    public function update(UpdateRoleRequest $request, Role $role, RoleService $roleService): JsonResponse
    {
        return ApiResponse::tryCatch(
            fn() => ApiResponse::success($roleService->update($role, $request->validated()), 'Role updated successfully')
        );
    }

    public function destroy(Role $role, RoleService $roleService): JsonResponse
    {
        return ApiResponse::tryCatch(function () use ($role, $roleService) {
            $roleService->delete($role);
            return ApiResponse::success(null, 'Role deleted successfully');
        });
    }

    public function syncPermissions(Request $request, Role $role, RoleService $roleService): JsonResponse
    {
        $request->validate(['permission_ids' => ['present', 'array'], 'permission_ids.*' => ['exists:permissions,id']]);
        return ApiResponse::tryCatch(
            fn() => ApiResponse::success($roleService->syncPermissions($role, $request->input('permission_ids', [])), 'Permissions updated')
        );
    }

    public function syncMenus(Request $request, Role $role, RoleService $roleService): JsonResponse
    {
        $request->validate(['menu_ids' => ['present', 'array'], 'menu_ids.*' => ['exists:menus,id']]);
        return ApiResponse::tryCatch(
            fn() => ApiResponse::success($roleService->syncMenus($role, $request->input('menu_ids', [])), 'Menus updated')
        );
    }

    public function permissions(RoleService $roleService): JsonResponse
    {
        return ApiResponse::tryCatch(
            fn() => ApiResponse::success($roleService->allPermissions())
        );
    }
}
