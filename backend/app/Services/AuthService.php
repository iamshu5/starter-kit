<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthService
{
    public function register(array $data): void
    {
        User::create([
            'name'      => $data['name'],
            'username'  => $data['username'],
            'email'     => $data['email'],
            'password'  => Hash::make($data['password']),
            'role_id'   => null,
            'is_active' => false,
        ]);
    }

    public function login(array $data): array
    {
        $login = $data['login'];
        $field = filter_var($login, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';

        $user = User::where($field, $login)->with('role')->first();

        if (!$user || !Hash::check($data['password'], $user->password)) {
            throw new \InvalidArgumentException('Username/Email atau Password yang Anda masukkan salah.');
        }

        if (!$user->is_active) {
            throw new \InvalidArgumentException('Akun Anda tidak aktif, Silahkan hubungi Admin untuk diaktifkan.');
        }

        $token = $user->createToken('api-token')->plainTextToken;

        return [
            'token' => $token,
            'user'  => $this->formatUser($user),
        ];
    }

    public function logout(User $user): void
    {
        $user->tokens()->where('id', $user->currentAccessToken()->id)->delete();
    }

    public function me(User $user): array
    {
        return $this->formatUser($user->load('role.permissions', 'role.menus'));
    }

    public function updateProfile(User $user, array $data): array
    {
        if (!empty($data['password'])) {
            if (!Hash::check($data['current_password'], $user->password)) {
                throw new \InvalidArgumentException('Password saat ini tidak sesuai.');
            }
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        unset($data['current_password'], $data['password_confirmation']);

        $user->update($data);

        return $this->formatUser($user->fresh()->load('role'));
    }

    private function formatUser(User $user): array
    {
        return [
            'id'         => $user->id,
            'name'       => $user->name,
            'username'   => $user->username,
            'email'      => $user->email,
            'is_active'  => $user->is_active,
            'role'       => $user->role ? [
                'id'   => $user->role->id,
                'name' => $user->role->name,
                'slug' => $user->role->slug,
            ] : null,
        ];
    }
}
