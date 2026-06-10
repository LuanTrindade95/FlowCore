<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InstanceStepResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'workflow_instance_id' => $this->workflow_instance_id,
            'workflow_step_id' => $this->workflow_step_id,
            'status' => $this->status->value,
            'assigned_to' => $this->assigned_to,
            'approval_mode' => $this->approval_mode->value,
            'decisions_needed' => $this->decisions_needed,
            'decisions_count' => $this->decisions_count,
            'due_at' => $this->due_at?->toISOString(),
            'completed_at' => $this->completed_at?->toISOString(),
        ];
    }
}
