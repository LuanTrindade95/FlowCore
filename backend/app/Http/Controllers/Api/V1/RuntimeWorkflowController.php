<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Workflow\Enums\WorkflowDefinitionStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\WorkflowDefinitionResource;
use App\Models\WorkflowDefinition;
use App\Models\WorkflowInstance;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

class RuntimeWorkflowController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        abort_unless(
            Gate::allows('create', WorkflowInstance::class) || Gate::allows('viewAny', WorkflowInstance::class),
            403
        );

        $workflows = WorkflowDefinition::query()
            ->where('status', WorkflowDefinitionStatus::Published)
            ->whereNotExists(function ($query) {
                $query->selectRaw('1')
                    ->from('workflow_definitions as newer')
                    ->whereColumn('newer.slug', 'workflow_definitions.slug')
                    ->where('newer.status', WorkflowDefinitionStatus::Published->value)
                    ->whereColumn('newer.version', '>', 'workflow_definitions.version');
            })
            ->with(['formFields' => fn ($query) => $query->orderBy('order')])
            ->orderBy('name')
            ->get();

        return WorkflowDefinitionResource::collection($workflows);
    }

    public function show(WorkflowDefinition $workflow): WorkflowDefinitionResource
    {
        Gate::authorize('create', WorkflowInstance::class);

        abort_unless($workflow->status === WorkflowDefinitionStatus::Published, 404);

        return new WorkflowDefinitionResource($workflow->load([
            'formFields' => fn ($query) => $query->orderBy('order'),
        ]));
    }
}
