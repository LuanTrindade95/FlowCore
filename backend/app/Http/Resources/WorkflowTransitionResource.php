<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WorkflowTransitionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'workflow_definition_id' => $this->workflow_definition_id,
            'from_step_id' => $this->from_step_id,
            'to_step_id' => $this->to_step_id,
            'on_event' => $this->on_event->value,
            'condition_expression' => $this->condition_expression,
        ];
    }
}
