<?php

namespace App\Models;

use App\Domain\Workflow\Enums\FormFieldType;
use Database\Factories\FormFieldFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FormField extends Model
{
    /** @use HasFactory<FormFieldFactory> */
    use HasFactory;

    protected $fillable = [
        'workflow_definition_id',
        'key',
        'label',
        'type',
        'required',
        'options',
        'order',
    ];

    protected function casts(): array
    {
        return [
            'type' => FormFieldType::class,
            'required' => 'boolean',
            'options' => 'array',
            'order' => 'integer',
        ];
    }

    public function definition(): BelongsTo
    {
        return $this->belongsTo(WorkflowDefinition::class, 'workflow_definition_id');
    }

    /**
     * @return list<string>|null
     */
    public function normalizedOptions(): ?array
    {
        $options = $this->options;

        if (is_array($options) && isset($options['options']) && is_array($options['options'])) {
            $options = $options['options'];
        }

        if (! is_array($options)) {
            return null;
        }

        return array_values(array_filter($options, 'is_string'));
    }
}
