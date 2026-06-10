<?php

namespace App\Data\Workflow;

use App\Domain\Workflow\Enums\WorkflowInstanceStatus;
use Carbon\CarbonImmutable;
use Spatie\LaravelData\Data;

class WorkflowInstanceData extends Data
{
    /**
     * @param  array<string, mixed>|null  $data
     */
    public function __construct(
        public readonly ?int $id,
        public readonly int $workflowDefinitionId,
        public readonly int $definitionVersion,
        public readonly int $requesterId,
        public readonly WorkflowInstanceStatus $status,
        public readonly ?int $currentStepId,
        public readonly ?array $data,
        public readonly ?CarbonImmutable $startedAt,
        public readonly ?CarbonImmutable $finishedAt,
    ) {}
}
