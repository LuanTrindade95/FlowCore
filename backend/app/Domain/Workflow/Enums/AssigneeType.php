<?php

namespace App\Domain\Workflow\Enums;

enum AssigneeType: string
{
    case User = 'user';
    case Role = 'role';
    case Dynamic = 'dynamic';
}
