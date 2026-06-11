<?php

namespace App\Domain\Workflow\Services;

use App\Domain\Workflow\Enums\InstanceStepStatus;
use App\Domain\Workflow\Enums\WorkflowActionType;
use App\Models\InstanceStep;
use App\Models\WorkflowAction;
use Illuminate\Support\Facades\DB;

class WorkflowEscalationService
{
    public function __construct(
        private readonly RuntimeEventDispatcher $runtimeEvents,
    ) {}

    public function escalateOverdueSteps(): int
    {
        $escalated = 0;

        InstanceStep::query()
            ->whereIn('status', [InstanceStepStatus::Pending, InstanceStepStatus::InProgress])
            ->whereNotNull('due_at')
            ->where('due_at', '<=', now())
            ->orderBy('id')
            ->chunkById(100, function ($steps) use (&$escalated): void {
                foreach ($steps as $step) {
                    if ($this->escalateStep($step)) {
                        $escalated++;
                    }
                }
            });

        return $escalated;
    }

    private function escalateStep(InstanceStep $step): bool
    {
        return DB::transaction(function () use ($step): bool {
            $lockedStep = InstanceStep::query()
                ->with(['instance.requester', 'instance.steps.step.approvers', 'step'])
                ->whereKey($step->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (! in_array($lockedStep->status, [InstanceStepStatus::Pending, InstanceStepStatus::InProgress], true)) {
                return false;
            }

            if ($lockedStep->due_at === null || $lockedStep->due_at->isFuture()) {
                return false;
            }

            $lockedStep->transitionTo(InstanceStepStatus::Escalated);

            WorkflowAction::create([
                'workflow_instance_id' => $lockedStep->workflow_instance_id,
                'instance_step_id' => $lockedStep->id,
                'actor_id' => null,
                'action' => WorkflowActionType::Escalated,
                'payload' => [
                    'due_at' => $lockedStep->due_at?->toISOString(),
                    'escalated_at' => now()->toISOString(),
                ],
            ]);

            $this->runtimeEvents->dispatch($lockedStep->instance, WorkflowActionType::Escalated, $lockedStep);

            return true;
        });
    }
}
