<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FormFieldResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'workflow_definition_id' => $this->workflow_definition_id,
            'key' => $this->key,
            'label' => $this->label,
            'type' => $this->type->value,
            'required' => $this->required,
            'options' => $this->normalizedOptions(),
            'order' => $this->order,
        ];
    }
}
