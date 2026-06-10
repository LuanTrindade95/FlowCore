<?php

namespace App\Domain\Workflow\Exceptions;

use DomainException;

final class InvalidWorkflowStateTransition extends DomainException
{
    public static function forInstance(string $from, string $to): self
    {
        return new self("Invalid workflow instance transition from [{$from}] to [{$to}].");
    }

    public static function forStep(string $from, string $to): self
    {
        return new self("Invalid instance step transition from [{$from}] to [{$to}].");
    }
}
