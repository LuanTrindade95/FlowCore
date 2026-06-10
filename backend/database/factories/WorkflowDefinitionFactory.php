<?php

namespace Database\Factories;

use App\Domain\Workflow\Enums\WorkflowDefinitionStatus;
use App\Models\WorkflowDefinition;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<WorkflowDefinition>
 */
class WorkflowDefinitionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->words(3, true);

        return [
            'name' => Str::title($name),
            'slug' => Str::slug($name),
            'description' => fake()->sentence(),
            'version' => 1,
            'status' => WorkflowDefinitionStatus::Draft,
            'category' => fake()->randomElement(['Financeiro', 'RH', 'Operacoes']),
        ];
    }

    public function published(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => WorkflowDefinitionStatus::Published,
        ]);
    }
}
