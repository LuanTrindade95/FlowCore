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
        return $user->can('requests.view-all') || $workflowInstance->requester_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->can('requests.create');
    }
}
