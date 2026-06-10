<?php

namespace Database\Factories;

use App\Domain\Workflow\Enums\ApprovalMode;
use App\Domain\Workflow\Enums\InstanceStepStatus;
use App\Models\InstanceStep;
use App\Models\User;
use App\Models\WorkflowInstance;
use App\Models\WorkflowStep;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<InstanceStep>
 */
class InstanceStepFactory extends Factory
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
            'workflow_step_id' => WorkflowStep::factory(),
            'status' => InstanceStepStatus::Pending,
            'assigned_to' => User::factory(),
            'approval_mode' => ApprovalMode::Any,
            'decisions_needed' => 1,
            'decisions_count' => 0,
            'due_at' => now()->addDay(),
            'completed_at' => null,
        ];
    }
}
