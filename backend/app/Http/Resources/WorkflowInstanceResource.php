<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WorkflowInstanceResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'workflow_definition_id' => $this->workflow_definition_id,
            'definition_version' => $this->definition_version,
            'requester_id' => $this->requester_id,
            'status' => $this->status->value,
            'current_step_id' => $this->current_step_id,
            'data' => $this->data ?? [],
            'started_at' => $this->started_at?->toISOString(),
            'finished_at' => $this->finished_at?->toISOString(),
            'steps' => InstanceStepResource::collection($this->whenLoaded('steps')),
            'actions' => WorkflowActionResource::collection($this->whenLoaded('actions')),
        ];
    }
}
