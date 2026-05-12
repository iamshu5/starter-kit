<?php

namespace App\Http\Middleware;

use App\Helpers\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();

        if (!$user) {
            return ApiResponse::error('Unauthenticated.', 401);
        }

        if (!$user->hasPermission($permission)) {
            return ApiResponse::error('Anda tidak memiliki akses untuk action ini!', 403);
        }

        return $next($request);
    }
}
