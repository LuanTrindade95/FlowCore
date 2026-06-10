<?php

namespace App\Domain\Workflow\Enums;

enum WorkflowDefinitionStatus: string
{
    case Draft = 'draft';
    case Published = 'published';
    case Archived = 'archived';
}
