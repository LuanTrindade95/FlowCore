<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Workflow\Services\WorkflowEngine;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\ListWorkflowRequestsRequest;
use App\Http\Requests\Api\V1\StartWorkflowRequest;
use App\Http\Resources\InstanceStepResource;
use App\Http\Resources\WorkflowInstanceResource;
use App\Models\InstanceStep;
use App\Models\WorkflowDefinition;
use App\Models\WorkflowInstance;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

class WorkflowRequestController extends Controller
{
    public function index(ListWorkflowRequestsRequest $request): AnonymousResourceCollection
    {
        $instances = WorkflowInstance::query()
            ->visibleTo($request->user())
            ->with($this->runtimeRelations())
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->when($request->filled('workflow_definition_id'), fn ($query) => $query->where('workflow_definition_id', $request->integer('workflow_definition_id')))
            ->when($request->boolean('mine'), fn ($query) => $query->where('requester_id', $request->user()->id))
            ->when($request->filled('from'), fn ($query) => $query->whereDate('started_at', '>=', $request->string('from')))
            ->when($request->filled('to'), fn ($query) => $query->whereDate('started_at', '<=', $request->string('to')))
            ->latest('started_at')
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

        return new WorkflowInstanceResource($instance->load($this->runtimeRelations()));
    }

    public function show(WorkflowInstance $request): WorkflowInstanceResource
    {
        Gate::authorize('view', $request);

        return new WorkflowInstanceResource($request->load($this->runtimeRelations()));
    }

    public function inbox(): AnonymousResourceCollection
    {
        $steps = InstanceStep::query()
            ->with([
                'instance.definition',
                'instance.requester',
                'step',
                'assignee',
            ])
            ->where(function ($query) {
                $query->where('assigned_to', request()->user()->id)
                    ->orWhereNull('assigned_to');
            })
            ->whereIn('status', ['pending', 'in_progress', 'escalated'])
            ->latest()
            ->paginate(20);

        return InstanceStepResource::collection($steps);
    }

    /**
     * @return list<string>
     */
    private function runtimeRelations(): array
    {
        return [
            'definition',
            'requester',
            'currentStep',
            'steps.step',
            'steps.assignee',
            'actions.actor',
            'actions.instanceStep.step',
        ];
    }
}
