<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StartWorkflowRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('requests.create') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'workflow_definition_id' => ['required', 'integer', Rule::exists('workflow_definitions', 'id')],
            'data' => ['required', 'array'],
        ];
    }
}
