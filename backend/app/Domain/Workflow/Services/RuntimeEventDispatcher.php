<?php

namespace App\Domain\Workflow\Services;

use App\Domain\Workflow\Enums\InstanceStepStatus;
use App\Domain\Workflow\Enums\WorkflowActionType;
use App\Events\RuntimeWorkflowUpdated;
use App\Models\InstanceStep;
use App\Models\User;
use App\Models\WorkflowInstance;

class RuntimeEventDispatcher
{
    public function __construct(
        private readonly AssigneeResolver $assigneeResolver,
    ) {}

    /**
     * @param  list<int>  $extraRecipientUserIds
     */
    public function dispatch(
        WorkflowInstance $instance,
        WorkflowActionType $action,
        ?InstanceStep $instanceStep = null,
        array $extraRecipientUserIds = [],
    ): void {
        event(new RuntimeWorkflowUpdated(
            $this->recipientUserIds($instance, $extraRecipientUserIds),
            $instance->id,
            $instanceStep?->id,
            $action,
        ));
    }

    /**
     * @param  list<int>  $extraRecipientUserIds
     * @return list<int>
     */
    private function recipientUserIds(WorkflowInstance $instance, array $extraRecipientUserIds): array
    {
        $instance->loadMissing([
            'requester',
            'steps.step.approvers',
        ]);

        $recipients = collect($extraRecipientUserIds)
            ->push($instance->requester_id)
            ->merge(User::permission('requests.view-all')->pluck('id'));

        foreach ($instance->steps as $step) {
            if (! in_array($step->status, [
                InstanceStepStatus::Pending,
                InstanceStepStatus::InProgress,
                InstanceStepStatus::Escalated,
            ], true)) {
                continue;
            }

            if ($step->assigned_to !== null) {
                $recipients->push($step->assigned_to);

                continue;
            }

            $recipients = $recipients->merge(
                $this->assigneeResolver->resolve($step->step, $instance)->pluck('id')
            );
        }

        return $recipients
            ->filter(fn ($userId): bool => is_numeric($userId))
            ->map(fn ($userId): int => (int) $userId)
            ->unique()
            ->values()
            ->all();
    }
}
