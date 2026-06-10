<?php

namespace App\Domain\Workflow\Services;

use App\Domain\Workflow\Enums\InstanceStepDecisionValue;
use App\Domain\Workflow\Enums\InstanceStepStatus;
use App\Domain\Workflow\Enums\TransitionEvent;
use App\Domain\Workflow\Enums\WorkflowActionType;
use App\Domain\Workflow\Enums\WorkflowDefinitionStatus;
use App\Domain\Workflow\Enums\WorkflowInstanceStatus;
use App\Domain\Workflow\Exceptions\WorkflowEngineException;
use App\Models\InstanceStep;
use App\Models\InstanceStepDecision;
use App\Models\User;
use App\Models\WorkflowAction;
use App\Models\WorkflowDefinition;
use App\Models\WorkflowInstance;
use App\Models\WorkflowStep;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class WorkflowEngine
{
    public function __construct(
        private readonly AssigneeResolver $assigneeResolver,
        private readonly ConditionEvaluator $conditionEvaluator,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function start(WorkflowDefinition $definition, User $requester, array $data): WorkflowInstance
    {
        if ($definition->status !== WorkflowDefinitionStatus::Published) {
            throw WorkflowEngineException::workflowNotPublished();
        }

        $definition->loadMissing(['formFields', 'steps.approvers']);
        $this->validateFormData($definition, $data);

        return DB::transaction(function () use ($definition, $requester, $data): WorkflowInstance {
            $startStep = $definition->steps->firstWhere('is_start', true);

            if (! $startStep) {
                throw WorkflowEngineException::startStepMissing();
            }

            $instance = WorkflowInstance::create([
                'workflow_definition_id' => $definition->id,
                'definition_version' => $definition->version,
                'requester_id' => $requester->id,
                'status' => WorkflowInstanceStatus::Running,
                'current_step_id' => $startStep->id,
                'data' => $data,
                'started_at' => now(),
            ]);

            $instanceStep = $this->activateStep($instance, $startStep);

            $this->recordAction($instance, $instanceStep, $requester, WorkflowActionType::Submitted, [
                'data' => $data,
            ]);

            return $instance->load(['steps', 'actions']);
        });
    }

    public function decide(InstanceStep $instanceStep, User $actor, InstanceStepDecisionValue $decision, ?string $comment = null): WorkflowInstance
    {
        return DB::transaction(function () use ($instanceStep, $actor, $decision, $comment): WorkflowInstance {
            $lockedStep = InstanceStep::query()
                ->with(['instance.definition', 'step.approvers', 'decisions'])
                ->whereKey($instanceStep->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (! in_array($lockedStep->status, [InstanceStepStatus::Pending, InstanceStepStatus::InProgress, InstanceStepStatus::Escalated], true)) {
                throw WorkflowEngineException::stepAlreadyClosed();
            }

            if (! $this->actorCanDecide($lockedStep, $actor)) {
                throw WorkflowEngineException::actorCannotDecide();
            }

            if ($lockedStep->decisions()->where('actor_id', $actor->id)->exists()) {
                throw WorkflowEngineException::duplicateDecision();
            }

            InstanceStepDecision::create([
                'instance_step_id' => $lockedStep->id,
                'actor_id' => $actor->id,
                'decision' => $decision,
                'comment' => $comment,
            ]);

            $lockedStep->increment('decisions_count');
            $lockedStep->refresh();

            $this->recordAction(
                $lockedStep->instance,
                $lockedStep,
                $actor,
                $decision === InstanceStepDecisionValue::Approve ? WorkflowActionType::Approved : WorkflowActionType::Rejected,
                ['comment' => $comment]
            );

            if ($decision === InstanceStepDecisionValue::Reject) {
                $lockedStep->transitionTo(InstanceStepStatus::Rejected);

                return $this->advance($lockedStep->instance, $lockedStep->step, TransitionEvent::Rejected);
            }

            if ($lockedStep->decisions_count >= $lockedStep->decisions_needed) {
                $lockedStep->transitionTo(InstanceStepStatus::Approved);

                return $this->advance($lockedStep->instance, $lockedStep->step, TransitionEvent::Approved);
            }

            return $lockedStep->instance->refresh();
        });
    }

    public function advance(WorkflowInstance $instance, WorkflowStep $fromStep, TransitionEvent $event, int $depth = 0): WorkflowInstance
    {
        if ($depth > 50) {
            throw WorkflowEngineException::maxDepthExceeded();
        }

        $instance->loadMissing('definition');
        $fromStep->loadMissing('outgoingTransitions.toStep.approvers');

        $matchingTransitions = $fromStep->outgoingTransitions
            ->where('on_event', $event)
            ->filter(fn ($transition): bool => $this->conditionEvaluator->evaluate(
                $transition->condition_expression,
                $instance->data ?? []
            ))
            ->values();

        if ($matchingTransitions->isEmpty()) {
            $instance->current_step_id = null;
            $instance->save();
            $instance->transitionTo(match ($event) {
                TransitionEvent::Rejected => WorkflowInstanceStatus::Rejected,
                TransitionEvent::Completed => WorkflowInstanceStatus::Completed,
                default => WorkflowInstanceStatus::Approved,
            });

            return $instance->refresh();
        }

        foreach ($matchingTransitions as $index => $transition) {
            $instanceStep = $this->activateStep($instance, $transition->toStep);

            if ($index === 0) {
                $instance->current_step_id = $transition->to_step_id;
                $instance->save();
            }

            $this->recordAction($instance, $instanceStep, null, WorkflowActionType::AutoAdvanced, [
                'from_step_id' => $fromStep->id,
                'to_step_id' => $transition->to_step_id,
                'event' => $event->value,
            ]);
        }

        return $instance->refresh();
    }

    public function reassign(InstanceStep $instanceStep, User $actor, User $newAssignee): InstanceStep
    {
        if (! $this->actorCanDecide($instanceStep->loadMissing(['instance', 'step.approvers']), $actor)) {
            throw WorkflowEngineException::actorCannotDecide();
        }

        $instanceStep->update(['assigned_to' => $newAssignee->id]);

        $this->recordAction($instanceStep->instance, $instanceStep, $actor, WorkflowActionType::Reassigned, [
            'new_assignee_id' => $newAssignee->id,
        ]);

        return $instanceStep->refresh();
    }

    public function comment(InstanceStep $instanceStep, User $actor, string $comment): WorkflowAction
    {
        return $this->recordAction($instanceStep->instance, $instanceStep, $actor, WorkflowActionType::Commented, [
            'comment' => $comment,
        ]);
    }

    private function activateStep(WorkflowInstance $instance, WorkflowStep $step): InstanceStep
    {
        $assignees = $this->assigneeResolver->resolve($step, $instance);
        $approvalMode = $this->assigneeResolver->approvalMode($step);

        return InstanceStep::create([
            'workflow_instance_id' => $instance->id,
            'workflow_step_id' => $step->id,
            'status' => InstanceStepStatus::InProgress,
            'assigned_to' => $assignees->count() === 1 ? $assignees->first()->id : null,
            'approval_mode' => $approvalMode,
            'decisions_needed' => $this->assigneeResolver->decisionsNeeded($step, $instance),
            'decisions_count' => 0,
            'due_at' => $step->sla_hours ? now()->addHours($step->sla_hours) : null,
        ]);
    }

    private function actorCanDecide(InstanceStep $instanceStep, User $actor): bool
    {
        if (! $actor->can('requests.decide')) {
            return false;
        }

        $assigneeIds = $this->assigneeResolver
            ->resolve($instanceStep->step, $instanceStep->instance)
            ->pluck('id')
            ->all();

        return in_array($actor->id, $assigneeIds, true);
    }

    private function recordAction(
        WorkflowInstance $instance,
        ?InstanceStep $instanceStep,
        ?User $actor,
        WorkflowActionType $action,
        array $payload = [],
    ): WorkflowAction {
        return WorkflowAction::create([
            'workflow_instance_id' => $instance->id,
            'instance_step_id' => $instanceStep?->id,
            'actor_id' => $actor?->id,
            'action' => $action,
            'payload' => $payload,
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function validateFormData(WorkflowDefinition $definition, array $data): void
    {
        $errors = [];

        foreach ($definition->formFields as $field) {
            if ($field->required && ! array_key_exists($field->key, $data)) {
                $errors[$field->key][] = 'Campo obrigatorio.';
            }
        }

        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }
    }
}
