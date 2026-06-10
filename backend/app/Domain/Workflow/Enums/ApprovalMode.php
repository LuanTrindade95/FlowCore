<?php

namespace App\Domain\Workflow\Enums;

enum ApprovalMode: string
{
    case Any = 'any';
    case All = 'all';
    case Quorum = 'quorum';
}
