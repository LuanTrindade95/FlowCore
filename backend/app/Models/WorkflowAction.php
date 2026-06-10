<?php

namespace App\Models;

use App\Domain\Workflow\Enums\WorkflowActionType;
use Database\Factories\WorkflowActionFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkflowAction extends Model
{
    /** @use HasFactory<WorkflowActionFactory> */
    use HasFactory;

    protected $fillable = [
        'workflow_instance_id',
        'instance_step_id',
        'actor_id',
        'action',
        'payload',
    ];

    protected function casts(): array
    {
        return [
            'action' => WorkflowActionType::class,
            'payload' => 'array',
        ];
    }

    public function instance(): BelongsTo
    {
        return $this->belongsTo(WorkflowInstance::class, 'workflow_instance_id');
    }

    public function instanceStep(): BelongsTo
    {
        return $this->belongsTo(InstanceStep::class);
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
