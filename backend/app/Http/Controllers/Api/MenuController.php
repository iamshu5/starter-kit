<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMenuRequest;
use App\Http\Requests\UpdateMenuRequest;
use App\Models\Menu;
use App\Services\MenuService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MenuController extends Controller
{
    public function index(Request $request, MenuService $menuService): JsonResponse
    {
        return ApiResponse::tryCatch(fn() =>
            ApiResponse::paginated($menuService->paginate(
                perPage: (int) $request->get('per_page', 15),
                search:  $request->get('search'),
                sortBy:  $request->get('sort_by', 'order'),
                sortDir: $request->get('sort_dir', 'asc'),
            ))
        );
    }

    public function flat(MenuService $menuService): JsonResponse
    {
        return ApiResponse::tryCatch(
            fn() => ApiResponse::success($menuService->flat())
        );
    }

    public function store(StoreMenuRequest $request, MenuService $menuService): JsonResponse
    {
        return ApiResponse::tryCatch(
            fn() => ApiResponse::success($menuService->create($request->validated()), 'Menu created successfully', 201)
        );
    }

    public function show(Menu $menu, MenuService $menuService): JsonResponse
    {
        return ApiResponse::tryCatch(
            fn() => ApiResponse::success($menuService->find($menu->id))
        );
    }

    public function update(UpdateMenuRequest $request, Menu $menu, MenuService $menuService): JsonResponse
    {
        return ApiResponse::tryCatch(
            fn() => ApiResponse::success($menuService->update($menu, $request->validated()), 'Menu updated successfully')
        );
    }

    public function destroy(Menu $menu, MenuService $menuService): JsonResponse
    {
        return ApiResponse::tryCatch(function () use ($menu, $menuService) {
            $menuService->delete($menu);
            return ApiResponse::success(null, 'Menu deleted successfully');
        });
    }

    public function sidebar(Request $request, MenuService $menuService): JsonResponse
    {
        return ApiResponse::tryCatch(function () use ($request, $menuService) {
            $user = $request->user();
            if (!$user->role) {
                return ApiResponse::success([]);
            }
            return ApiResponse::success($menuService->getSidebarForRole($user->role->id));
        });
    }
}
