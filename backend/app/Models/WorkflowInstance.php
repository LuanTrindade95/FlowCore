<?php

namespace App\Models;

use App\Domain\Workflow\Enums\WorkflowInstanceStatus;
use App\Domain\Workflow\Exceptions\InvalidWorkflowStateTransition;
use Database\Factories\WorkflowInstanceFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WorkflowInstance extends Model
{
    /** @use HasFactory<WorkflowInstanceFactory> */
    use HasFactory;

    private const ALLOWED_TRANSITIONS = [
        'running' => ['approved', 'rejected', 'cancelled', 'completed'],
        'approved' => [],
        'rejected' => [],
        'cancelled' => [],
        'completed' => [],
    ];

    protected $fillable = [
        'workflow_definition_id',
        'definition_version',
        'requester_id',
        'status',
        'current_step_id',
        'data',
        'started_at',
        'finished_at',
    ];

    protected function casts(): array
    {
        return [
            'definition_version' => 'integer',
            'status' => WorkflowInstanceStatus::class,
            'data' => 'array',
            'started_at' => 'datetime',
            'finished_at' => 'datetime',
        ];
    }

    public function definition(): BelongsTo
    {
        return $this->belongsTo(WorkflowDefinition::class, 'workflow_definition_id');
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function currentStep(): BelongsTo
    {
        return $this->belongsTo(WorkflowStep::class, 'current_step_id');
    }

    public function steps(): HasMany
    {
        return $this->hasMany(InstanceStep::class);
    }

    public function actions(): HasMany
    {
        return $this->hasMany(WorkflowAction::class);
    }

    public function scopeVisibleTo(Builder $query, User $user): Builder
    {
        if ($user->can('requests.view-all')) {
            return $query;
        }

        return $query->where(function (Builder $visibility) use ($user) {
            if ($user->can('requests.create')) {
                $visibility->orWhere('requester_id', $user->id);
            }

            if ($user->can('requests.decide')) {
                $visibility->orWhereHas('steps', function (Builder $steps) use ($user) {
                    $steps->where('assigned_to', $user->id)->orWhereNull('assigned_to');
                });
            }
        });
    }

    public function transitionTo(WorkflowInstanceStatus|string $status): void
    {
        $target = $status instanceof WorkflowInstanceStatus ? $status : WorkflowInstanceStatus::from($status);
        $current = $this->status instanceof WorkflowInstanceStatus
            ? $this->status
            : WorkflowInstanceStatus::from($this->status);

        if (! in_array($target->value, self::ALLOWED_TRANSITIONS[$current->value], true)) {
            throw InvalidWorkflowStateTransition::forInstance($current->value, $target->value);
        }

        $this->status = $target;
        $this->finished_at = $target === WorkflowInstanceStatus::Running ? null : now();
        $this->save();
    }
}
