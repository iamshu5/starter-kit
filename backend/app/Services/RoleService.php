<?php

namespace App\Services;

use App\Models\Role;
use App\Models\Permission;
use App\Traits\FullTextSearch;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class RoleService
{
    use FullTextSearch;
    public function all(): Collection
    {
        return Role::withCount('users')->get();
    }

    public function paginate(int $perPage = 15, ?string $search = null, string $sortBy = 'name', string $sortDir = 'asc'): LengthAwarePaginator
    {
        $allowed = ['name', 'slug', 'created_at'];
        $sortBy  = in_array($sortBy, $allowed) ? $sortBy : 'name';
        $sortDir = $sortDir === 'asc' ? 'asc' : 'desc';

        return Role::withCount('users')
            ->when($search, fn($q) => $this->applySearch($q, $search, ['name', 'slug']))
            ->orderBy($sortBy, $sortDir)
            ->paginate($perPage);
    }

    public function find(int $id): Role
    {
        return Role::with('permissions', 'menus')->findOrFail($id);
    }

    public function create(array $data): Role
    {
        return Role::create($data);
    }

    public function update(Role $role, array $data): Role
    {
        $role->update($data);
        return $role->fresh();
    }

    public function delete(Role $role): void
    {
        $role->delete();
    }

    public function syncPermissions(Role $role, array $permissionIds): Role
    {
        $role->permissions()->sync($permissionIds);
        return $role->load('permissions');
    }

    public function syncMenus(Role $role, array $menuIds): Role
    {
        $role->menus()->sync($menuIds);
        (new MenuService())->clearSidebarCache();
        return $role->load('menus');
    }

    public function allPermissions(): Collection
    {
        return Permission::orderBy('slug')->get();
    }
}
