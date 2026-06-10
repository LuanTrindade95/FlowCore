<?php

namespace Database\Factories;

use App\Domain\Workflow\Enums\WorkflowActionType;
use App\Models\User;
use App\Models\WorkflowAction;
use App\Models\WorkflowInstance;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<WorkflowAction>
 */
class WorkflowActionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'workflow_instance_id' => WorkflowInstance::factory(),
            'instance_step_id' => null,
            'actor_id' => User::factory(),
            'action' => WorkflowActionType::Submitted,
            'payload' => [],
        ];
    }
}
