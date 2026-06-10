<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Workflow\Enums\WorkflowDefinitionStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StepApproverRequest;
use App\Http\Resources\StepApproverResource;
use App\Models\StepApprover;
use App\Models\WorkflowDefinition;
use App\Models\WorkflowStep;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class StepApproverController extends Controller
{
    public function store(StepApproverRequest $request, WorkflowDefinition $workflow, WorkflowStep $step): StepApproverResource
    {
        $this->ensureDraft($workflow);
        $this->ensureStepBelongsToWorkflow($workflow, $step);

        $approver = $step->approvers()->create($request->validated());

        return new StepApproverResource($approver);
    }

    public function update(StepApproverRequest $request, WorkflowDefinition $workflow, WorkflowStep $step, StepApprover $approver): StepApproverResource
    {
        $this->ensureDraft($workflow);
        $this->ensureStepBelongsToWorkflow($workflow, $step);
        $this->ensureApproverBelongsToStep($step, $approver);

        $approver->update($request->validated());

        return new StepApproverResource($approver);
    }

    public function destroy(WorkflowDefinition $workflow, WorkflowStep $step, StepApprover $approver): JsonResponse
    {
        $this->ensureDraft($workflow);
        $this->ensureStepBelongsToWorkflow($workflow, $step);
        $this->ensureApproverBelongsToStep($step, $approver);

        $approver->delete();

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

    private function ensureApproverBelongsToStep(WorkflowStep $step, StepApprover $approver): void
    {
        if ($approver->workflow_step_id !== $step->id) {
            abort(404);
        }
    }
}
