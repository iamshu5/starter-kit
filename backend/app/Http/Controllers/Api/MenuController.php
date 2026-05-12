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
        $menus = $menuService->paginate(
            perPage: (int) $request->get('per_page', 15),
            search:  $request->get('search'),
            sortBy:  $request->get('sort_by', 'order'),
            sortDir: $request->get('sort_dir', 'asc'),
        );

        return ApiResponse::paginated($menus);
    }

    public function flat(MenuService $menuService): JsonResponse
    {
        return ApiResponse::success($menuService->flat());
    }

    public function store(StoreMenuRequest $request, MenuService $menuService): JsonResponse
    {
        $menu = $menuService->create($request->validated());
        return ApiResponse::success($menu, 'Menu created successfully', 201);
    }

    public function show(Menu $menu, MenuService $menuService): JsonResponse
    {
        return ApiResponse::success($menuService->find($menu->id));
    }

    public function update(UpdateMenuRequest $request, Menu $menu, MenuService $menuService): JsonResponse
    {
        $menu = $menuService->update($menu, $request->validated());
        return ApiResponse::success($menu, 'Menu updated successfully');
    }

    public function destroy(Menu $menu, MenuService $menuService): JsonResponse
    {
        $menuService->delete($menu);
        return ApiResponse::success(null, 'Menu deleted successfully');
    }

    public function sidebar(Request $request, MenuService $menuService): JsonResponse
    {
        $user = $request->user();

        if (!$user->role) {
            return ApiResponse::success([]);
        }

        $menus = $menuService->getSidebarForRole($user->role->id);
        return ApiResponse::success($menus);
    }
}
