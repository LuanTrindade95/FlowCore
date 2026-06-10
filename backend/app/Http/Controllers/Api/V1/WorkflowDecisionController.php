<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Workflow\Enums\InstanceStepDecisionValue;
use App\Domain\Workflow\Services\WorkflowEngine;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\CommentWorkflowStepRequest;
use App\Http\Requests\Api\V1\DecideWorkflowStepRequest;
use App\Http\Requests\Api\V1\ReassignWorkflowStepRequest;
use App\Http\Resources\InstanceStepResource;
use App\Http\Resources\WorkflowActionResource;
use App\Http\Resources\WorkflowInstanceResource;
use App\Models\InstanceStep;
use App\Models\User;
use App\Models\WorkflowInstance;
use Illuminate\Support\Facades\Gate;

class WorkflowDecisionController extends Controller
{
    public function decide(
        DecideWorkflowStepRequest $request,
        WorkflowInstance $workflowRequest,
        InstanceStep $step,
        WorkflowEngine $engine,
    ): WorkflowInstanceResource {
        $this->ensureStepBelongsToInstance($workflowRequest, $step);
        Gate::authorize('decide', $step);

        $instance = $engine->decide(
            $step,
            $request->user(),
            InstanceStepDecisionValue::from($request->string('decision')->toString()),
            $request->input('comment')
        );

        return new WorkflowInstanceResource($instance->load([
            'definition',
            'requester',
            'currentStep',
            'steps.step',
            'steps.assignee',
            'actions.actor',
            'actions.instanceStep.step',
        ]));
    }

    public function reassign(
        ReassignWorkflowStepRequest $request,
        WorkflowInstance $workflowRequest,
        InstanceStep $step,
        WorkflowEngine $engine,
    ): InstanceStepResource {
        $this->ensureStepBelongsToInstance($workflowRequest, $step);
        Gate::authorize('reassign', $step);

        $instanceStep = $engine->reassign(
            $step,
            $request->user(),
            User::findOrFail($request->integer('assigned_to'))
        );

        return new InstanceStepResource($instanceStep);
    }

    public function comment(
        CommentWorkflowStepRequest $request,
        WorkflowInstance $workflowRequest,
        InstanceStep $step,
        WorkflowEngine $engine,
    ): WorkflowActionResource {
        $this->ensureStepBelongsToInstance($workflowRequest, $step);
        Gate::authorize('comment', $step);

        return new WorkflowActionResource($engine->comment(
            $step,
            $request->user(),
            $request->string('comment')->toString()
        ));
    }

    private function ensureStepBelongsToInstance(WorkflowInstance $instance, InstanceStep $step): void
    {
        if ($step->workflow_instance_id !== $instance->id) {
            abort(404);
        }
    }
}
