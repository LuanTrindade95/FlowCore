<?php

namespace Database\Factories;

use App\Domain\Workflow\Enums\WorkflowStepType;
use App\Models\WorkflowDefinition;
use App\Models\WorkflowStep;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<WorkflowStep>
 */
class WorkflowStepFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->words(2, true);

        return [
            'workflow_definition_id' => WorkflowDefinition::factory(),
            'key' => Str::slug($name, '_'),
            'name' => Str::title($name),
            'type' => WorkflowStepType::Approval,
            'order' => 1,
            'config' => [],
            'sla_hours' => 24,
            'is_start' => false,
        ];
    }

    public function start(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_start' => true,
            'order' => 1,
        ]);
    }
}
