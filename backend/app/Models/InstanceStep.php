<?php

namespace App\Models;

use App\Domain\Workflow\Enums\ApprovalMode;
use App\Domain\Workflow\Enums\InstanceStepStatus;
use App\Domain\Workflow\Exceptions\InvalidWorkflowStateTransition;
use Database\Factories\InstanceStepFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InstanceStep extends Model
{
    /** @use HasFactory<InstanceStepFactory> */
    use HasFactory;

    private const ALLOWED_TRANSITIONS = [
        'pending' => ['in_progress', 'skipped', 'escalated'],
        'in_progress' => ['approved', 'rejected', 'skipped', 'escalated', 'completed'],
        'approved' => [],
        'rejected' => [],
        'skipped' => [],
        'escalated' => ['in_progress', 'approved', 'rejected', 'completed'],
        'completed' => [],
    ];

    protected $fillable = [
        'workflow_instance_id',
        'workflow_step_id',
        'status',
        'assigned_to',
        'approval_mode',
        'decisions_needed',
        'decisions_count',
        'due_at',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => InstanceStepStatus::class,
            'approval_mode' => ApprovalMode::class,
            'decisions_needed' => 'integer',
            'decisions_count' => 'integer',
            'due_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function instance(): BelongsTo
    {
        return $this->belongsTo(WorkflowInstance::class, 'workflow_instance_id');
    }

    public function step(): BelongsTo
    {
        return $this->belongsTo(WorkflowStep::class, 'workflow_step_id');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function decisions(): HasMany
    {
        return $this->hasMany(InstanceStepDecision::class);
    }

    public function actions(): HasMany
    {
        return $this->hasMany(WorkflowAction::class);
    }

    public function transitionTo(InstanceStepStatus|string $status): void
    {
        $target = $status instanceof InstanceStepStatus ? $status : InstanceStepStatus::from($status);
        $current = $this->status instanceof InstanceStepStatus
            ? $this->status
            : InstanceStepStatus::from($this->status);

        if (! in_array($target->value, self::ALLOWED_TRANSITIONS[$current->value], true)) {
            throw InvalidWorkflowStateTransition::forStep($current->value, $target->value);
        }

        $this->status = $target;
        $this->completed_at = in_array($target, [
            InstanceStepStatus::Approved,
            InstanceStepStatus::Rejected,
            InstanceStepStatus::Skipped,
            InstanceStepStatus::Completed,
        ], true) ? now() : null;
        $this->save();
    }
}
