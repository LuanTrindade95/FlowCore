<?php

namespace App\Domain\Workflow\Enums;

enum WorkflowInstanceStatus: string
{
    case Running = 'running';
    case Approved = 'approved';
    case Rejected = 'rejected';
    case Cancelled = 'cancelled';
    case Completed = 'completed';
}
