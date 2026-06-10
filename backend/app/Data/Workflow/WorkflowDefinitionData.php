<?php

namespace App\Data\Workflow;

use App\Domain\Workflow\Enums\WorkflowDefinitionStatus;
use Spatie\LaravelData\Data;

class WorkflowDefinitionData extends Data
{
    public function __construct(
        public readonly ?int $id,
        public readonly string $name,
        public readonly string $slug,
        public readonly ?string $description,
        public readonly int $version,
        public readonly WorkflowDefinitionStatus $status,
        public readonly ?string $category,
    ) {}
}
