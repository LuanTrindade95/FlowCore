<?php

namespace Database\Factories;

use App\Domain\Workflow\Enums\WorkflowInstanceStatus;
use App\Models\User;
use App\Models\WorkflowDefinition;
use App\Models\WorkflowInstance;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<WorkflowInstance>
 */
class WorkflowInstanceFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'workflow_definition_id' => WorkflowDefinition::factory()->published(),
            'definition_version' => 1,
            'requester_id' => User::factory(),
            'status' => WorkflowInstanceStatus::Running,
            'current_step_id' => null,
            'data' => [],
            'started_at' => now(),
            'finished_at' => null,
        ];
    }
}
