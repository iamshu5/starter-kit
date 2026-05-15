<?php

namespace App\Services;

use App\Models\Menu;
use App\Models\Role;
use App\Traits\FullTextSearch;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;

class MenuService
{
    use FullTextSearch;
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
            ->when($search, fn($q) => $this->applySearch($q, $search, ['name', 'slug', 'route']))
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
        $menu = Menu::create($data);
        $this->clearSidebarCache();
        return $menu;
    }

    public function update(Menu $menu, array $data): Menu
    {
        $menu->update($data);
        $this->clearSidebarCache();
        return $menu->fresh();
    }

    public function delete(Menu $menu): void
    {
        $menu->delete();
        $this->clearSidebarCache();
    }

    public function getSidebarForRole(int $roleId): Collection
    {
        return Cache::remember(
            "sidebar_role_{$roleId}",
            now()->addHour(),
            fn () => Menu::with(['children' => fn($q) => $q->where('is_active', true)->orderBy('order')])
                ->whereHas('roles', fn($q) => $q->where('roles.id', $roleId))
                ->whereNull('parent_id')
                ->where('is_active', true)
                ->orderBy('order')
                ->get()
        );
    }

    public function clearSidebarCache(): void
    {
        Role::pluck('id')->each(fn ($id) => Cache::forget("sidebar_role_{$id}"));
    }
}
