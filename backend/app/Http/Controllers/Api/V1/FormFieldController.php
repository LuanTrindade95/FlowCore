<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Workflow\Enums\WorkflowDefinitionStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\FormFieldRequest;
use App\Http\Resources\FormFieldResource;
use App\Models\FormField;
use App\Models\WorkflowDefinition;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class FormFieldController extends Controller
{
    public function store(FormFieldRequest $request, WorkflowDefinition $workflow): FormFieldResource
    {
        $this->ensureDraft($workflow);

        $field = $workflow->formFields()->create($request->validated());

        return new FormFieldResource($field);
    }

    public function update(FormFieldRequest $request, WorkflowDefinition $workflow, FormField $field): FormFieldResource
    {
        $this->ensureDraft($workflow);
        $this->ensureFieldBelongsToWorkflow($workflow, $field);

        $field->update($request->validated());

        return new FormFieldResource($field);
    }

    public function destroy(WorkflowDefinition $workflow, FormField $field): JsonResponse
    {
        $this->ensureDraft($workflow);
        $this->ensureFieldBelongsToWorkflow($workflow, $field);

        $field->delete();

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

    private function ensureFieldBelongsToWorkflow(WorkflowDefinition $workflow, FormField $field): void
    {
        if ($field->workflow_definition_id !== $workflow->id) {
            abort(404);
        }
    }
}
