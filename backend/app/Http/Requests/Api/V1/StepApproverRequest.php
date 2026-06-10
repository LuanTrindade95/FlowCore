<?php

namespace App\Http\Requests\Api\V1;

use App\Domain\Workflow\Enums\ApprovalMode;
use App\Domain\Workflow\Enums\AssigneeType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StepApproverRequest extends FormRequest
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
            'assignee_type' => ['required', Rule::in(array_column(AssigneeType::cases(), 'value'))],
            'assignee_ref' => ['required', 'string', 'max:255'],
            'approval_mode' => ['required', Rule::in(array_column(ApprovalMode::cases(), 'value'))],
            'quorum_n' => ['nullable', 'integer', 'min:1', 'required_if:approval_mode,quorum'],
        ];
    }
}
