<?php

namespace App\Models;

use App\Domain\Workflow\Enums\ApprovalMode;
use App\Domain\Workflow\Enums\AssigneeType;
use Database\Factories\StepApproverFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StepApprover extends Model
{
    /** @use HasFactory<StepApproverFactory> */
    use HasFactory;

    protected $fillable = [
        'workflow_step_id',
        'assignee_type',
        'assignee_ref',
        'approval_mode',
        'quorum_n',
    ];

    protected function casts(): array
    {
        return [
            'assignee_type' => AssigneeType::class,
            'approval_mode' => ApprovalMode::class,
            'quorum_n' => 'integer',
        ];
    }

    public function step(): BelongsTo
    {
        return $this->belongsTo(WorkflowStep::class, 'workflow_step_id');
    }
}
