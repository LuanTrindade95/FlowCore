<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Workflow\Enums\WorkflowDefinitionStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\WorkflowStepRequest;
use App\Http\Resources\WorkflowStepResource;
use App\Models\WorkflowDefinition;
use App\Models\WorkflowStep;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class WorkflowStepController extends Controller
{
    public function store(WorkflowStepRequest $request, WorkflowDefinition $workflow): WorkflowStepResource
    {
        $this->ensureDraft($workflow);

        $step = $workflow->steps()->create($request->validated());

        return new WorkflowStepResource($step);
    }

    public function update(WorkflowStepRequest $request, WorkflowDefinition $workflow, WorkflowStep $step): WorkflowStepResource
    {
        $this->ensureDraft($workflow);
        $this->ensureStepBelongsToWorkflow($workflow, $step);

        $step->update($request->validated());

        return new WorkflowStepResource($step);
    }

    public function destroy(WorkflowDefinition $workflow, WorkflowStep $step): JsonResponse
    {
        $this->ensureDraft($workflow);
        $this->ensureStepBelongsToWorkflow($workflow, $step);

        $step->delete();

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

    private function ensureStepBelongsToWorkflow(WorkflowDefinition $workflow, WorkflowStep $step): void
    {
        if ($step->workflow_definition_id !== $workflow->id) {
            abort(404);
        }
    }
}
