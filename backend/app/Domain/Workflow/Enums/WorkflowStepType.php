<?php

namespace App\Domain\Workflow\Enums;

enum WorkflowStepType: string
{
    case Approval = 'approval';
    case Task = 'task';
    case Notification = 'notification';
    case Automation = 'automation';
    case Condition = 'condition';
}
