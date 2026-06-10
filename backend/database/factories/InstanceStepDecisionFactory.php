<?php

namespace Database\Factories;

use App\Domain\Workflow\Enums\InstanceStepDecisionValue;
use App\Models\InstanceStep;
use App\Models\InstanceStepDecision;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<InstanceStepDecision>
 */
class InstanceStepDecisionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'instance_step_id' => InstanceStep::factory(),
            'actor_id' => User::factory(),
            'decision' => InstanceStepDecisionValue::Approve,
            'comment' => fake()->optional()->sentence(),
        ];
    }
}
