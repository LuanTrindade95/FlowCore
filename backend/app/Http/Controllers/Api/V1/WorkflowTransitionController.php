<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Workflow\Enums\WorkflowDefinitionStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\WorkflowTransitionRequest;
use App\Http\Resources\WorkflowTransitionResource;
use App\Models\WorkflowDefinition;
use App\Models\WorkflowStep;
use App\Models\WorkflowTransition;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class WorkflowTransitionController extends Controller
{
    public function store(WorkflowTransitionRequest $request, WorkflowDefinition $workflow): WorkflowTransitionResource
    {
        $this->ensureDraft($workflow);
        $this->ensureTransitionStepsBelongToWorkflow($workflow, $request->integer('from_step_id'), $request->integer('to_step_id'));

        $transition = $workflow->transitions()->create($request->validated());

        return new WorkflowTransitionResource($transition);
    }

    public function update(WorkflowTransitionRequest $request, WorkflowDefinition $workflow, WorkflowTransition $transition): WorkflowTransitionResource
    {
        $this->ensureDraft($workflow);
        $this->ensureTransitionBelongsToWorkflow($workflow, $transition);
        $this->ensureTransitionStepsBelongToWorkflow($workflow, $request->integer('from_step_id'), $request->integer('to_step_id'));

        $transition->update($request->validated());

        return new WorkflowTransitionResource($transition);
    }

    public function destroy(WorkflowDefinition $workflow, WorkflowTransition $transition): JsonResponse
    {
        $this->ensureDraft($workflow);
        $this->ensureTransitionBelongsToWorkflow($workflow, $transition);

        $transition->delete();

        return response()->json(status: 204);
    }

    private function ensureDraft(WorkflowDefinition $workflow): void
    {
        if ($workflow->status !== WorkflowDefinitionStatus::Draft) {
            throw ValidationException::withMessages([
                'workflow' => ['Definicoes publicadas ou arquivadas sao imutaveis.'],
            ]);
        }
    }

    private function ensureTransitionBelongsToWorkflow(WorkflowDefinition $workflow, WorkflowTransition $transition): void
    {
        if ($transition->workflow_definition_id !== $workflow->id) {
            abort(404);
        }
    }

    private function ensureTransitionStepsBelongToWorkflow(WorkflowDefinition $workflow, int $fromStepId, int $toStepId): void
    {
        $count = WorkflowStep::query()
            ->where('workflow_definition_id', $workflow->id)
            ->whereIn('id', [$fromStepId, $toStepId])
            ->count();

        if ($count !== 2) {
            throw ValidationException::withMessages([
                'steps' => ['As etapas da transicao precisam pertencer a definicao informada.'],
            ]);
        }
    }
}
