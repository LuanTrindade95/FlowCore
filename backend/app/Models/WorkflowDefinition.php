<?php

namespace App\Models;

use App\Domain\Workflow\Enums\WorkflowDefinitionStatus;
use Database\Factories\WorkflowDefinitionFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WorkflowDefinition extends Model
{
    /** @use HasFactory<WorkflowDefinitionFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'version',
        'status',
        'category',
    ];

    protected function casts(): array
    {
        return [
            'version' => 'integer',
            'status' => WorkflowDefinitionStatus::class,
        ];
    }

    public function steps(): HasMany
    {
        return $this->hasMany(WorkflowStep::class);
    }

    public function transitions(): HasMany
    {
        return $this->hasMany(WorkflowTransition::class);
    }

    public function formFields(): HasMany
    {
        return $this->hasMany(FormField::class);
    }

    public function instances(): HasMany
    {
        return $this->hasMany(WorkflowInstance::class);
    }

    public function isPublished(): bool
    {
        return $this->status === WorkflowDefinitionStatus::Published;
    }
}
