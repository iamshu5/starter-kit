<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMenuRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $menuId = $this->route('menu')?->id;

        return [
            'parent_id' => ['nullable', 'exists:menus,id'],
            'name' => ['sometimes', 'string', 'max:100'],
            'slug' => ['sometimes', 'string', 'max:100', 'alpha_dash', Rule::unique('menus', 'slug')->ignore($menuId)],
            'icon' => ['nullable', 'string', 'max:10000'],
            'route' => ['nullable', 'string', 'max:255'],
            'order' => ['integer', 'min:0'],
            'is_active' => ['boolean'],
        ];
    }
}
