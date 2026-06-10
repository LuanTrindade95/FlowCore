<?php

namespace App\Data\Workflow;

use App\Domain\Workflow\Enums\WorkflowStepType;
use Spatie\LaravelData\Data;

class WorkflowStepData extends Data
{
    /**
     * @param  array<string, mixed>|null  $config
     */
    public function __construct(
        public readonly ?int $id,
        public readonly int $workflowDefinitionId,
        public readonly string $key,
        public readonly string $name,
        public readonly WorkflowStepType $type,
        public readonly int $order,
        public readonly ?array $config,
        public readonly ?int $slaHours,
        public readonly bool $isStart,
    ) {}
}
