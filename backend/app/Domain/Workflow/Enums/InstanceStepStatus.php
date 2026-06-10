<?php

namespace App\Domain\Workflow\Enums;

enum InstanceStepStatus: string
{
    case Pending = 'pending';
    case InProgress = 'in_progress';
    case Approved = 'approved';
    case Rejected = 'rejected';
    case Skipped = 'skipped';
    case Escalated = 'escalated';
    case Completed = 'completed';
}
