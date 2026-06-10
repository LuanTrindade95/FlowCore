<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StepApproverResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'workflow_step_id' => $this->workflow_step_id,
            'assignee_type' => $this->assignee_type->value,
            'assignee_ref' => $this->assignee_ref,
            'approval_mode' => $this->approval_mode->value,
            'quorum_n' => $this->quorum_n,
        ];
    }
}
