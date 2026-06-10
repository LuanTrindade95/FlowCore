<?php

namespace App\Data\Workflow;

use App\Domain\Workflow\Enums\TransitionEvent;
use Spatie\LaravelData\Data;

class WorkflowTransitionData extends Data
{
    public function __construct(
        public readonly ?int $id,
        public readonly int $workflowDefinitionId,
        public readonly int $fromStepId,
        public readonly int $toStepId,
        public readonly TransitionEvent $onEvent,
        public readonly ?string $conditionExpression,
    ) {}
}
