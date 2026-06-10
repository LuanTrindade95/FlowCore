<?php

namespace App\Domain\Workflow\Exceptions;

use DomainException;

class WorkflowEngineException extends DomainException
{
    public static function workflowNotPublished(): self
    {
        return new self('Workflow definition must be published before execution.');
    }

    public static function startStepMissing(): self
    {
        return new self('Published workflow definition does not have a start step.');
    }

    public static function actorCannotDecide(): self
    {
        return new self('Actor cannot decide this instance step.');
    }

    public static function stepAlreadyClosed(): self
    {
        return new self('Instance step is already closed.');
    }

    public static function duplicateDecision(): self
    {
        return new self('Actor already decided this instance step.');
    }

    public static function maxDepthExceeded(): self
    {
        return new self('Workflow execution exceeded the maximum graph depth.');
    }

    public static function conditionEvaluationFailed(): self
    {
        return new self('Workflow condition could not be evaluated safely.');
    }
}
