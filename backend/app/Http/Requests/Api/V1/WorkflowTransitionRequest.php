<?php

namespace App\Http\Requests\Api\V1;

use App\Domain\Workflow\Enums\TransitionEvent;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class WorkflowTransitionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('workflows.manage') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'from_step_id' => ['required', 'integer', Rule::exists('workflow_steps', 'id')],
            'to_step_id' => ['required', 'integer', Rule::exists('workflow_steps', 'id')],
            'on_event' => ['required', Rule::in(array_column(TransitionEvent::cases(), 'value'))],
            'condition_expression' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
