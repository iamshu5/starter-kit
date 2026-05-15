<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->api(prepend: [
            \App\Http\Middleware\ForceJsonResponse::class,
        ]);
        $middleware->alias([
            'permission' => \App\Http\Middleware\CheckPermission::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, $request) {
            if ($request->expectsJson()) {
                return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
            }
        });

        $exceptions->render(function (\Illuminate\Validation\ValidationException $e, $request) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed.',
                    'errors'  => $e->errors(),
                ], 422);
            }
        });

        $exceptions->render(function (\Illuminate\Database\Eloquent\ModelNotFoundException $e, $request) {
            if ($request->expectsJson()) {
                return response()->json(['success' => false, 'message' => 'Resource not found.'], 404);
            }
        });

        $exceptions->render(function (\Illuminate\Database\QueryException $e, $request) {
            if ($request->expectsJson()) {
                $message = config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan pada database.';
                return response()->json(['success' => false, 'message' => $message], 500);
            }
        });

        $exceptions->render(function (ThrottleRequestsException $e, $request) {
            if ($request->expectsJson()) {
                return response()->json(['success' => false, 'message' => 'Terlalu banyak permintaan. Silakan coba lagi nanti.'], 429);
            }
        });

        // 404 dari route yang tidak ada (bukan ModelNotFoundException)
        $exceptions->render(function (NotFoundHttpException $e, $request) {
            if ($request->expectsJson()) {
                return response()->json(['success' => false, 'message' => 'Endpoint tidak ditemukan.'], 404);
            }
        });

        $exceptions->render(function (MethodNotAllowedHttpException $e, $request) {
            if ($request->expectsJson()) {
                $allowed = $e->getHeaders()['Allow'] ?? '';
                $message = config('app.debug') && $allowed
                    ? "Method tidak diizinkan. Gunakan: {$allowed}"
                    : 'Method tidak diizinkan.';
                return response()->json(['success' => false, 'message' => $message], 405);
            }
        });

        $exceptions->render(function (\Throwable $e, $request) {
            if ($request->expectsJson() && !config('app.debug')) {
                $status = method_exists($e, 'getStatusCode') ? $e->getStatusCode() : 500;
                if ($status >= 500) {
                    return response()->json(['success' => false, 'message' => 'Terjadi kesalahan pada server.'], 500);
                }
            }
        });
    })->create();

