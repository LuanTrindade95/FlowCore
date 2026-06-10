<?php

namespace App\Policies;

use App\Domain\Workflow\Enums\InstanceStepStatus;
use App\Models\InstanceStep;
use App\Models\User;

class DecisionPolicy
{
    public function decide(User $user, InstanceStep $instanceStep): bool
    {
        return $user->can('requests.decide')
            && in_array($instanceStep->status, [
                InstanceStepStatus::Pending,
                InstanceStepStatus::InProgress,
                InstanceStepStatus::Escalated,
            ], true)
            && ($instanceStep->assigned_to === null || $instanceStep->assigned_to === $user->id);
    }

    public function reassign(User $user, InstanceStep $instanceStep): bool
    {
        return $this->decide($user, $instanceStep);
    }

    public function comment(User $user, InstanceStep $instanceStep): bool
    {
        return $this->decide($user, $instanceStep)
            || $instanceStep->instance?->requester_id === $user->id;
    }
}
