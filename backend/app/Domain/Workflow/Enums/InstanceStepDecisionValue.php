<?php

namespace App\Domain\Workflow\Enums;

enum InstanceStepDecisionValue: string
{
    case Approve = 'approve';
    case Reject = 'reject';
}
