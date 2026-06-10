<?php

namespace App\Http\Requests\Api\V1;

use App\Domain\Workflow\Enums\WorkflowInstanceStatus;
use App\Models\WorkflowInstance;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class ListWorkflowRequestsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::forUser($this->user())->allows('viewAny', WorkflowInstance::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'status' => ['nullable', Rule::in(array_column(WorkflowInstanceStatus::cases(), 'value'))],
            'workflow_definition_id' => ['nullable', 'integer', Rule::exists('workflow_definitions', 'id')],
            'mine' => ['nullable', 'boolean'],
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from'],
        ];
    }
}
