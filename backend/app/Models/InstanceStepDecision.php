<?php

namespace App\Models;

use App\Domain\Workflow\Enums\InstanceStepDecisionValue;
use Database\Factories\InstanceStepDecisionFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InstanceStepDecision extends Model
{
    /** @use HasFactory<InstanceStepDecisionFactory> */
    use HasFactory;

    protected $fillable = [
        'instance_step_id',
        'actor_id',
        'decision',
        'comment',
    ];

    protected function casts(): array
    {
        return [
            'decision' => InstanceStepDecisionValue::class,
        ];
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
