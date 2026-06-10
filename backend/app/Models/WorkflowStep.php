<?php

namespace App\Models;

use App\Domain\Workflow\Enums\WorkflowStepType;
use Database\Factories\WorkflowStepFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WorkflowStep extends Model
{
    /** @use HasFactory<WorkflowStepFactory> */
    use HasFactory;

    protected $fillable = [
        'workflow_definition_id',
        'key',
        'name',
        'type',
        'order',
        'config',
        'sla_hours',
        'is_start',
    ];

    protected function casts(): array
    {
        return [
            'type' => WorkflowStepType::class,
            'order' => 'integer',
            'config' => 'array',
            'sla_hours' => 'integer',
            'is_start' => 'boolean',
        ];
    }

    public function definition(): BelongsTo
    {
        return $this->belongsTo(WorkflowDefinition::class, 'workflow_definition_id');
    }

    public function approvers(): HasMany
    {
        return $this->hasMany(StepApprover::class);
    }

    public function outgoingTransitions(): HasMany
    {
        return $this->hasMany(WorkflowTransition::class, 'from_step_id');
    }

    public function incomingTransitions(): HasMany
    {
        return $this->hasMany(WorkflowTransition::class, 'to_step_id');
    }

    public function instanceSteps(): HasMany
    {
        return $this->hasMany(InstanceStep::class);
    }
}
