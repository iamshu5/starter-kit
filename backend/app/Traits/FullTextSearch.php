<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;

trait FullTextSearch
{
    protected function applySearch(Builder $query, string $search, array $columns): void
    {
        $trimmed = trim($search);

        if ($trimmed === '') {
            return;
        }

        $query->where(function (Builder $q) use ($trimmed, $columns): void {
            foreach ($columns as $index => $column) {
                $index === 0
                    ? $q->where($column, 'like', "%{$trimmed}%")
                    : $q->orWhere($column, 'like', "%{$trimmed}%");
            }
        });
    }
}
