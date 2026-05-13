<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->user()->id;

        return [
            'name' => ['sometimes', 'string', 'max:100'],
            'username' => ['sometimes', 'string', 'max:50', 'alpha_dash', Rule::unique('users')->ignore($userId)],
            'email' => ['sometimes', 'email', 'max:100', Rule::unique('users')->ignore($userId)],
            'current_password' => ['required_with:password', 'string'],
            'password' => ['sometimes', 'nullable', 'string', 'min:8', 'confirmed'],
            'password_confirmation' => ['sometimes', 'nullable', 'string'],
        ];
    }
}
