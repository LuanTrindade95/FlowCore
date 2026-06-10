<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WorkflowDefinitionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'version' => $this->version,
            'status' => $this->status->value,
            'category' => $this->category,
            'steps' => WorkflowStepResource::collection($this->whenLoaded('steps')),
            'transitions' => WorkflowTransitionResource::collection($this->whenLoaded('transitions')),
            'form_fields' => FormFieldResource::collection($this->whenLoaded('formFields')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
