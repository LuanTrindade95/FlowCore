<?php

namespace App\Http\Requests\Api\V1;

use App\Domain\Workflow\Enums\FormFieldType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class FormFieldRequest extends FormRequest
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
            'label' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::in(array_column(FormFieldType::cases(), 'value'))],
            'required' => ['required', 'boolean'],
            'options' => ['nullable', 'array'],
            'order' => ['required', 'integer', 'min:0'],
        ];
    }
}
