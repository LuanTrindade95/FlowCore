<?php

use App\Http\Controllers\Api\BroadcastAuthController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\FormFieldController;
use App\Http\Controllers\Api\V1\RuntimeAssigneeController;
use App\Http\Controllers\Api\V1\RuntimeDashboardController;
use App\Http\Controllers\Api\V1\RuntimeWorkflowController;
use App\Http\Controllers\Api\V1\StepApproverController;
use App\Http\Controllers\Api\V1\WorkflowDecisionController;
use App\Http\Controllers\Api\V1\WorkflowDefinitionController;
use App\Http\Controllers\Api\V1\WorkflowRequestController;
use App\Http\Controllers\Api\V1\WorkflowStepController;
use App\Http\Controllers\Api\V1\WorkflowTransitionController;
use App\Models\WorkflowInstance;
use Illuminate\Support\Facades\Route;

Route::model('workflowRequest', WorkflowInstance::class);

Route::post('broadcasting/auth', BroadcastAuthController::class)->middleware('auth:sanctum');

Route::prefix('v1')->group(function () {
    Route::post('auth/login', [AuthController::class, 'login'])->middleware('guest');

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('auth/me', [AuthController::class, 'me']);
        Route::post('auth/logout', [AuthController::class, 'logout']);

        Route::get('authorization/workflows-manage-smoke', fn () => response()->json([
            'message' => 'Permissao validada.',
        ]))->middleware('permission:workflows.manage');

        Route::get('inbox', [WorkflowRequestController::class, 'inbox']);
        Route::get('runtime/workflows', [RuntimeWorkflowController::class, 'index']);
        Route::get('runtime/workflows/{workflow}', [RuntimeWorkflowController::class, 'show']);
        Route::get('runtime/assignees', [RuntimeAssigneeController::class, 'index']);
        Route::get('dashboard', RuntimeDashboardController::class);
        Route::get('requests', [WorkflowRequestController::class, 'index']);
        Route::post('requests', [WorkflowRequestController::class, 'store']);
        Route::get('requests/{workflowInstanceId}', [WorkflowRequestController::class, 'show']);
        Route::post('requests/{workflowRequest}/steps/{step}/decide', [WorkflowDecisionController::class, 'decide']);
        Route::post('requests/{workflowRequest}/steps/{step}/reassign', [WorkflowDecisionController::class, 'reassign']);
        Route::post('requests/{workflowRequest}/steps/{step}/comment', [WorkflowDecisionController::class, 'comment']);

        Route::middleware('permission:workflows.manage')->group(function () {
            Route::apiResource('workflows', WorkflowDefinitionController::class);
            Route::post('workflows/{workflow}/publish', [WorkflowDefinitionController::class, 'publish']);
            Route::post('workflows/{workflow}/draft', [WorkflowDefinitionController::class, 'createDraftFromPublished']);

            Route::post('workflows/{workflow}/steps', [WorkflowStepController::class, 'store']);
            Route::put('workflows/{workflow}/steps/{step}', [WorkflowStepController::class, 'update']);
            Route::delete('workflows/{workflow}/steps/{step}', [WorkflowStepController::class, 'destroy']);

            Route::post('workflows/{workflow}/transitions', [WorkflowTransitionController::class, 'store']);
            Route::put('workflows/{workflow}/transitions/{transition}', [WorkflowTransitionController::class, 'update']);
            Route::delete('workflows/{workflow}/transitions/{transition}', [WorkflowTransitionController::class, 'destroy']);

            Route::post('workflows/{workflow}/steps/{step}/approvers', [StepApproverController::class, 'store']);
            Route::put('workflows/{workflow}/steps/{step}/approvers/{approver}', [StepApproverController::class, 'update']);
            Route::delete('workflows/{workflow}/steps/{step}/approvers/{approver}', [StepApproverController::class, 'destroy']);

            Route::post('workflows/{workflow}/form-fields', [FormFieldController::class, 'store']);
            Route::put('workflows/{workflow}/form-fields/{field}', [FormFieldController::class, 'update']);
            Route::delete('workflows/{workflow}/form-fields/{field}', [FormFieldController::class, 'destroy']);
        });
    });
});
