<?php

namespace App\Services;

use App\Models\User;
use App\Traits\FullTextSearch;
use Illuminate\Pagination\LengthAwarePaginator;

class UserService
{
    use FullTextSearch;
    public function paginate(int $perPage = 15, ?string $search = null, string $sortBy = 'created_at', string $sortDir = 'desc'): LengthAwarePaginator
    {
        $allowed = ['name', 'username', 'email', 'created_at'];
        $sortBy  = in_array($sortBy, $allowed) ? $sortBy : 'created_at';
        $sortDir = $sortDir === 'asc' ? 'asc' : 'desc';

        return User::with('role')
            ->when($search, fn($q) => $this->applySearch($q, $search, ['name', 'username', 'email']))
            ->orderBy($sortBy, $sortDir)
            ->paginate($perPage);
    }

    public function create(array $data): User
    {
        return User::create($data);
    }

    public function update(User $user, array $data): User
    {
        if (isset($data['password']) && blank($data['password'])) {
            unset($data['password']);
        }

        $user->update($data);

        return $user->fresh('role');
    }

    public function delete(User $user): void
    {
        $user->tokens()->delete();
        $user->delete();
    }
}
