<?php

namespace App\Domain\Workflow\Services;

use App\Domain\Workflow\Exceptions\WorkflowEngineException;
use Symfony\Component\ExpressionLanguage\ExpressionLanguage;
use Throwable;

class ConditionEvaluator
{
    public function __construct(
        private readonly ExpressionLanguage $expressionLanguage = new ExpressionLanguage,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function evaluate(?string $expression, array $data): bool
    {
        if ($expression === null || trim($expression) === '') {
            return true;
        }

        $variables = array_keys($data);
        try {
            $parsed = $this->expressionLanguage->parse($expression, $variables);

            return (bool) $this->expressionLanguage->evaluate((string) $parsed, $data);
        } catch (Throwable) {
            throw WorkflowEngineException::conditionEvaluationFailed();
        }
    }
}
