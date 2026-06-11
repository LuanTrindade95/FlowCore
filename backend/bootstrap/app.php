<?php

use App\Domain\Workflow\Exceptions\WorkflowEngineException;
use App\Http\Middleware\ForceJsonResponse;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Middleware\PermissionMiddleware;
use Spatie\Permission\Middleware\RoleMiddleware;
use Spatie\Permission\Middleware\RoleOrPermissionMiddleware;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withBroadcasting(__DIR__.'/../routes/channels.php', ['middleware' => ['api', 'auth:sanctum']])
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->api(prepend: [
            ForceJsonResponse::class,
        ]);

        $middleware->alias([
            'role' => RoleMiddleware::class,
            'permission' => PermissionMiddleware::class,
            'role_or_permission' => RoleOrPermissionMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->shouldRenderJsonWhen(fn (Request $request): bool => $request->is('api/*') || $request->expectsJson());

        $exceptions->render(function (Throwable $exception, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            if ($exception instanceof ValidationException) {
                $status = $exception->status;

                return response()->json([
                    'message' => $status === 401
                        ? 'As credenciais informadas sao invalidas.'
                        : 'Os dados enviados sao invalidos.',
                    'code' => $status === 401 ? 'INVALID_CREDENTIALS' : 'VALIDATION_ERROR',
                    'errors' => $exception->errors(),
                ], $status);
            }

            if ($exception instanceof AuthenticationException) {
                return response()->json([
                    'message' => 'Autenticacao necessaria.',
                    'code' => 'UNAUTHENTICATED',
                ], 401);
            }

            if ($exception instanceof AuthorizationException) {
                return response()->json([
                    'message' => 'Voce nao tem permissao para executar esta acao.',
                    'code' => 'FORBIDDEN',
                ], 403);
            }

            if ($exception instanceof WorkflowEngineException) {
                return response()->json([
                    'message' => 'Nao foi possivel executar a transicao do workflow.',
                    'code' => 'WORKFLOW_ENGINE_ERROR',
                    'errors' => ['workflow' => [$exception->getMessage()]],
                ], 422);
            }

            if ($exception instanceof HttpExceptionInterface) {
                return response()->json([
                    'message' => $exception->getStatusCode() === 404
                        ? 'Recurso nao encontrado.'
                        : ($exception->getMessage() ?: 'Erro na requisicao.'),
                    'code' => match ($exception->getStatusCode()) {
                        401 => 'UNAUTHENTICATED',
                        403 => 'FORBIDDEN',
                        404 => 'NOT_FOUND',
                        default => 'HTTP_ERROR',
                    },
                ], $exception->getStatusCode());
            }

            return null;
        });
    })->create();
