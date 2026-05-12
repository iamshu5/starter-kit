<?php

namespace App\Services;

use App\Models\Menu;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class MenuService
{
    public function all(): Collection
    {
        return Menu::with('children')->whereNull('parent_id')->orderBy('order')->get();
    }

    public function paginate(int $perPage = 15, ?string $search = null, string $sortBy = 'order', string $sortDir = 'asc'): LengthAwarePaginator
    {
        $allowed = ['name', 'slug', 'route', 'order', 'created_at'];
        $sortBy  = in_array($sortBy, $allowed) ? $sortBy : 'order';
        $sortDir = $sortDir === 'asc' ? 'asc' : 'desc';

        return Menu::with('parent:id,name')
            ->when($search, fn($q) => $q->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('slug', 'like', "%{$search}%")
                  ->orWhere('route', 'like', "%{$search}%");
            }))
            ->orderBy($sortBy, $sortDir)
            ->paginate($perPage);
    }

    public function flat(): Collection
    {
        return Menu::orderBy('order')->get();
    }

    public function find(int $id): Menu
    {
        return Menu::with('children')->findOrFail($id);
    }

    public function create(array $data): Menu
    {
        return Menu::create($data);
    }

    public function update(Menu $menu, array $data): Menu
    {
        $menu->update($data);
        return $menu->fresh();
    }

    public function delete(Menu $menu): void
    {
        $menu->delete();
    }

    public function getSidebarForRole(int $roleId): Collection
    {
        return Menu::with('children')
            ->whereHas('roles', fn($q) => $q->where('roles.id', $roleId))
            ->whereNull('parent_id')
            ->where('is_active', true)
            ->orderBy('order')
            ->get();
    }
}
