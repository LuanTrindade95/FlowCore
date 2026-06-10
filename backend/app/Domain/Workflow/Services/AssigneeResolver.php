<?php

namespace App\Domain\Workflow\Services;

use App\Domain\Workflow\Enums\ApprovalMode;
use App\Domain\Workflow\Enums\AssigneeType;
use App\Models\User;
use App\Models\WorkflowInstance;
use App\Models\WorkflowStep;
use Illuminate\Support\Collection;

class AssigneeResolver
{
    /**
     * @return Collection<int, User>
     */
    public function resolve(WorkflowStep $step, WorkflowInstance $instance): Collection
    {
        $step->loadMissing('approvers');

        return $step->approvers
            ->flatMap(function ($approver) use ($instance) {
                return match ($approver->assignee_type) {
                    AssigneeType::User => $this->resolveUser($approver->assignee_ref),
                    AssigneeType::Role => User::role($approver->assignee_ref)->get(),
                    AssigneeType::Dynamic => $this->resolveDynamic($approver->assignee_ref, $instance),
                };
            })
            ->unique('id')
            ->values();
    }

    public function approvalMode(WorkflowStep $step): ApprovalMode
    {
        $step->loadMissing('approvers');

        return $step->approvers->first()?->approval_mode ?? ApprovalMode::Any;
    }

    public function decisionsNeeded(WorkflowStep $step, WorkflowInstance $instance): int
    {
        $mode = $this->approvalMode($step);
        $assigneesCount = max(1, $this->resolve($step, $instance)->count());
        $quorum = $step->approvers->first()?->quorum_n;

        return match ($mode) {
            ApprovalMode::Any => 1,
            ApprovalMode::All => $assigneesCount,
            ApprovalMode::Quorum => min($assigneesCount, max(1, (int) $quorum)),
        };
    }

    /**
     * @return Collection<int, User>
     */
    private function resolveUser(string $reference): Collection
    {
        return User::query()
            ->where('id', $reference)
            ->orWhere('email', $reference)
            ->get();
    }

    /**
     * @return Collection<int, User>
     */
    private function resolveDynamic(string $reference, WorkflowInstance $instance): Collection
    {
        if ($reference !== 'requester_manager') {
            return collect();
        }

        return User::role('approver')
            ->whereKeyNot($instance->requester_id)
            ->limit(1)
            ->get();
    }
}
