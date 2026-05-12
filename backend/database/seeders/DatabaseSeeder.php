<?php

namespace Database\Seeders;

use App\Models\Menu;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        // Roles
        $admin = Role::create(['name' => 'Administrator', 'slug' => 'admin', 'description' => 'Full system access']);
        $staff = Role::create(['name' => 'Staff', 'slug' => 'staff', 'description' => 'Limited access']);

        // Permissions
        $permissionGroups = [
            ['name' => 'View Users',    'slug' => 'users.view'],
            ['name' => 'Create Users',  'slug' => 'users.create'],
            ['name' => 'Update Users',  'slug' => 'users.update'],
            ['name' => 'Delete Users',  'slug' => 'users.delete'],
            ['name' => 'View Roles',    'slug' => 'roles.view'],
            ['name' => 'Create Roles',  'slug' => 'roles.create'],
            ['name' => 'Update Roles',  'slug' => 'roles.update'],
            ['name' => 'Delete Roles',  'slug' => 'roles.delete'],
            ['name' => 'View Menus',    'slug' => 'menus.view'],
            ['name' => 'Create Menus',  'slug' => 'menus.create'],
            ['name' => 'Update Menus',  'slug' => 'menus.update'],
            ['name' => 'Delete Menus',  'slug' => 'menus.delete'],
        ];

        $permissions = collect($permissionGroups)->map(fn($p) => Permission::create($p));
        $admin->permissions()->sync($permissions->pluck('id'));

        // Menus — icon pake SVG dari HeroIcons
        $menus = [
            [
                'name' => 'Dashboard', 'slug' => 'dashboard', 'route' => '/dashboard', 'order' => 1,
                'icon' => '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" /></svg>',
            ],
            [
                'name' => 'Users', 'slug' => 'users', 'route' => '/users', 'order' => 2,
                'icon' => '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>',
            ],
            [
                'name' => 'Roles', 'slug' => 'roles', 'route' => '/roles', 'order' => 3,
                'icon' => '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" /></svg>',
            ],
            [
                'name' => 'Menus', 'slug' => 'menus', 'route' => '/menus', 'order' => 4,
                'icon' => '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>',
            ],
        ];

        $createdMenus = collect($menus)->map(fn($m) => Menu::create($m));
        $admin->menus()->sync($createdMenus->pluck('id'));

        $staff->menus()->sync($createdMenus->where('slug', 'dashboard')->pluck('id'));

        // Admin user
        User::create([
            'name'     => 'Administrator',
            'username' => 'admin',
            'email'    => 'admin@example.com',
            'password' => Hash::make('password'),
            'role_id'  => $admin->id,
            'is_active'=> true,
        ]);

        // Staff user
        User::create([
            'name'     => 'Staff User',
            'username' => 'staff',
            'email'    => 'staff@example.com',
            'password' => Hash::make('password'),
            'role_id'  => $staff->id,
            'is_active'=> true,
        ]);
    }
}
