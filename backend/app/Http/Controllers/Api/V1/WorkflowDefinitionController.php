<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Workflow\Enums\WorkflowDefinitionStatus;
use App\Domain\Workflow\Validation\GraphValidator;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\WorkflowDefinitionRequest;
use App\Http\Resources\WorkflowDefinitionResource;
use App\Models\WorkflowDefinition;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class WorkflowDefinitionController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return WorkflowDefinitionResource::collection(
            WorkflowDefinition::query()
                ->latest()
                ->paginate(20)
        );
    }

    public function store(WorkflowDefinitionRequest $request): WorkflowDefinitionResource
    {
        $workflow = WorkflowDefinition::create([
            ...$request->validated(),
            'version' => 0,
            'status' => WorkflowDefinitionStatus::Draft,
        ]);

        return new WorkflowDefinitionResource($this->loadGraph($workflow));
    }

    public function show(WorkflowDefinition $workflow): WorkflowDefinitionResource
    {
        return new WorkflowDefinitionResource($this->loadGraph($workflow));
    }

    public function update(WorkflowDefinitionRequest $request, WorkflowDefinition $workflow): WorkflowDefinitionResource
    {
        $this->ensureDraft($workflow);

        $workflow->update($request->validated());

        return new WorkflowDefinitionResource($this->loadGraph($workflow));
    }

    public function destroy(WorkflowDefinition $workflow): JsonResponse
    {
        $this->ensureDraft($workflow);

        $workflow->delete();

        return response()->json(status: 204);
    }

    public function publish(WorkflowDefinition $workflow, GraphValidator $validator): WorkflowDefinitionResource
    {
        $this->ensureDraft($workflow);

        $errors = $validator->validate($workflow);

        if ($errors !== []) {
            throw ValidationException::withMessages([
                'graph' => $errors,
            ]);
        }

        $workflow->update([
            'version' => max(
                $workflow->version,
                ((int) WorkflowDefinition::query()
                    ->where('slug', $workflow->slug)
                    ->where('status', WorkflowDefinitionStatus::Published)
                    ->max('version')) + 1
            ),
            'status' => WorkflowDefinitionStatus::Published,
        ]);

        return new WorkflowDefinitionResource($this->loadGraph($workflow));
    }

    public function createDraftFromPublished(WorkflowDefinition $workflow): WorkflowDefinitionResource
    {
        if (! $workflow->isPublished()) {
            throw ValidationException::withMessages([
                'workflow' => ['Apenas definicoes publicadas podem gerar nova versao draft.'],
            ]);
        }

        $draft = DB::transaction(function () use ($workflow): WorkflowDefinition {
            $workflow->load(['steps.approvers', 'transitions', 'formFields']);

            $nextVersion = ((int) WorkflowDefinition::query()
                ->where('slug', $workflow->slug)
                ->max('version')) + 1;

            $draft = WorkflowDefinition::create([
                'name' => $workflow->name,
                'slug' => $workflow->slug,
                'description' => $workflow->description,
                'version' => $nextVersion,
                'status' => WorkflowDefinitionStatus::Draft,
                'category' => $workflow->category,
            ]);

            $stepIdMap = [];

            foreach ($workflow->steps as $step) {
                $clonedStep = $draft->steps()->create($step->only([
                    'key',
                    'name',
                    'type',
                    'order',
                    'config',
                    'sla_hours',
                    'is_start',
                ]));

                $stepIdMap[$step->id] = $clonedStep->id;

                foreach ($step->approvers as $approver) {
                    $clonedStep->approvers()->create($approver->only([
                        'assignee_type',
                        'assignee_ref',
                        'approval_mode',
                        'quorum_n',
                    ]));
                }
            }

            foreach ($workflow->formFields as $field) {
                $draft->formFields()->create($field->only([
                    'key',
                    'label',
                    'type',
                    'required',
                    'options',
                    'order',
                ]));
            }

            foreach ($workflow->transitions as $transition) {
                $draft->transitions()->create([
                    'from_step_id' => $stepIdMap[$transition->from_step_id],
                    'to_step_id' => $stepIdMap[$transition->to_step_id],
                    'on_event' => $transition->on_event,
                    'condition_expression' => $transition->condition_expression,
                ]);
            }

            return $draft;
        });

        return new WorkflowDefinitionResource($this->loadGraph($draft));
    }

    private function loadGraph(WorkflowDefinition $workflow): WorkflowDefinition
    {
        return $workflow->load([
            'steps' => fn ($query) => $query->orderBy('order'),
            'steps.approvers',
            'transitions',
            'formFields' => fn ($query) => $query->orderBy('order'),
        ]);
    }

    private function ensureDraft(WorkflowDefinition $workflow): void
    {
        if ($workflow->status !== WorkflowDefinitionStatus::Draft) {
            throw ValidationException::withMessages([
                'workflow' => ['Definicoes publicadas ou arquivadas sao imutaveis. Crie uma nova versao draft para editar.'],
            ]);
        }
    }
}
