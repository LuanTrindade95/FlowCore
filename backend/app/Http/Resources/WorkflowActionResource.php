<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WorkflowActionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'workflow_instance_id' => $this->workflow_instance_id,
            'instance_step_id' => $this->instance_step_id,
            'actor_id' => $this->actor_id,
            'action' => $this->action->value,
            'payload' => $this->payload ?? [],
            'created_at' => $this->created_at?->toISOString(),
            'actor' => UserSummaryResource::make($this->whenLoaded('actor')),
            'step' => $this->when(
                $this->relationLoaded('instanceStep') && $this->instanceStep !== null,
                fn () => WorkflowStepResource::make($this->instanceStep->step)
            ),
        ];
    }
}
