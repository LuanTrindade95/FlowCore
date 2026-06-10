<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Workflow\Services\WorkflowEngine;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StartWorkflowRequest;
use App\Http\Resources\InstanceStepResource;
use App\Http\Resources\WorkflowInstanceResource;
use App\Models\InstanceStep;
use App\Models\WorkflowDefinition;
use App\Models\WorkflowInstance;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class WorkflowRequestController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $instances = WorkflowInstance::query()
            ->with(['steps', 'actions'])
            ->latest()
            ->paginate(20);

        return WorkflowInstanceResource::collection($instances);
    }

    public function store(StartWorkflowRequest $request, WorkflowEngine $engine): WorkflowInstanceResource
    {
        $instance = $engine->start(
            WorkflowDefinition::findOrFail($request->integer('workflow_definition_id')),
            $request->user(),
            $request->array('data')
        );

        return new WorkflowInstanceResource($instance->load(['steps', 'actions']));
    }

    public function show(WorkflowInstance $request): WorkflowInstanceResource
    {
        return new WorkflowInstanceResource($request->load(['steps', 'actions']));
    }

    public function inbox(): AnonymousResourceCollection
    {
        $steps = InstanceStep::query()
            ->with(['instance', 'step'])
            ->where(function ($query) {
                $query->where('assigned_to', request()->user()->id)
                    ->orWhereNull('assigned_to');
            })
            ->whereIn('status', ['pending', 'in_progress', 'escalated'])
            ->latest()
            ->paginate(20);

        return InstanceStepResource::collection($steps);
    }
}
