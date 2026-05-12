<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->route('user')?->id;

        return [
            'name'      => ['sometimes', 'string', 'max:255'],
            'username'  => ['sometimes', 'string', 'max:50', 'alpha_dash', "unique:users,username,{$userId}"],
            'email'     => ['sometimes', 'email', 'max:255', "unique:users,email,{$userId}"],
            'password'  => ['sometimes', 'nullable', 'string', 'min:8'],
            'role_id'   => ['nullable', 'exists:roles,id'],
            'is_active' => ['boolean'],
        ];
    }
}
