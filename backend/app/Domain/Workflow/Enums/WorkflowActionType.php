<?php

namespace App\Domain\Workflow\Enums;

enum WorkflowActionType: string
{
    case Submitted = 'submitted';
    case Approved = 'approved';
    case Rejected = 'rejected';
    case Reassigned = 'reassigned';
    case Commented = 'commented';
    case Escalated = 'escalated';
    case AutoAdvanced = 'auto_advanced';
    case Cancelled = 'cancelled';
}
