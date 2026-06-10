<?php

namespace App\Policies;

use App\Models\User;
use App\Models\WorkflowDefinition;

class WorkflowDefinitionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('workflows.manage') || $user->can('requests.view-all');
    }

    public function view(User $user, WorkflowDefinition $workflowDefinition): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $user->can('workflows.manage');
    }

    public function update(User $user, WorkflowDefinition $workflowDefinition): bool
    {
        return $user->can('workflows.manage');
    }

    public function delete(User $user, WorkflowDefinition $workflowDefinition): bool
    {
        return $user->can('workflows.manage');
    }
}
