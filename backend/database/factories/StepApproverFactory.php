<?php

namespace Database\Factories;

use App\Domain\Workflow\Enums\ApprovalMode;
use App\Domain\Workflow\Enums\AssigneeType;
use App\Models\StepApprover;
use App\Models\WorkflowStep;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StepApprover>
 */
class StepApproverFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'workflow_step_id' => WorkflowStep::factory(),
            'assignee_type' => AssigneeType::Role,
            'assignee_ref' => 'approver',
            'approval_mode' => ApprovalMode::Any,
            'quorum_n' => null,
        ];
    }
}
