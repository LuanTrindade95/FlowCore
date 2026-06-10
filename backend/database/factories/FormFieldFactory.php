<?php

namespace Database\Factories;

use App\Domain\Workflow\Enums\FormFieldType;
use App\Models\FormField;
use App\Models\WorkflowDefinition;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<FormField>
 */
class FormFieldFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $label = fake()->unique()->words(2, true);

        return [
            'workflow_definition_id' => WorkflowDefinition::factory(),
            'key' => Str::slug($label, '_'),
            'label' => Str::title($label),
            'type' => FormFieldType::Text,
            'required' => true,
            'options' => null,
            'order' => 1,
        ];
    }
}
