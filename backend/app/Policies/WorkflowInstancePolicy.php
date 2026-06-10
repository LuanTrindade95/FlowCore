<?php

namespace App\Policies;

use App\Models\User;
use App\Models\WorkflowInstance;

class WorkflowInstancePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('requests.view-all') || $user->can('requests.create') || $user->can('requests.decide');
    }

    public function view(User $user, WorkflowInstance $workflowInstance): bool
    {
        return WorkflowInstance::query()
            ->visibleTo($user)
            ->whereKey($workflowInstance->id)
            ->exists();
    }

    public function create(User $user): bool
    {
        return $user->can('requests.create');
    }
}
