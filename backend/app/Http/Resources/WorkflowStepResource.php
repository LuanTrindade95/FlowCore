<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WorkflowStepResource extends JsonResource
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
            'name' => $this->name,
            'type' => $this->type->value,
            'order' => $this->order,
            'config' => $this->config ?? [],
            'sla_hours' => $this->sla_hours,
            'is_start' => $this->is_start,
            'approvers' => StepApproverResource::collection($this->whenLoaded('approvers')),
        ];
    }
}
