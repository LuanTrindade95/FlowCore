<?php

namespace App\Http\Requests\Api\V1;

use App\Domain\Workflow\Enums\WorkflowStepType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class WorkflowStepRequest extends FormRequest
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
            'key' => ['required', 'string', 'max:255', 'alpha_dash:ascii'],
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::in(array_column(WorkflowStepType::cases(), 'value'))],
            'order' => ['required', 'integer', 'min:0'],
            'config' => ['nullable', 'array'],
            'sla_hours' => ['nullable', 'integer', 'min:1'],
            'is_start' => ['required', 'boolean'],
        ];
    }
}
