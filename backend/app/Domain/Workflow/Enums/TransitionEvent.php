<?php

namespace App\Domain\Workflow\Enums;

enum TransitionEvent: string
{
    case Approved = 'approved';
    case Rejected = 'rejected';
    case Completed = 'completed';
    case Condition = 'condition';
}
