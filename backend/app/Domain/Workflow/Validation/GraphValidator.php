<?php

namespace App\Domain\Workflow\Validation;

use App\Models\WorkflowDefinition;
use App\Models\WorkflowStep;
use Symfony\Component\ExpressionLanguage\ExpressionLanguage;
use Throwable;

class GraphValidator
{
    /**
     * @return list<array{code: string, message: string, meta?: array<string, mixed>}>
     */
    public function validate(WorkflowDefinition $definition): array
    {
        $definition->loadMissing(['steps.outgoingTransitions', 'formFields']);

        $errors = [];
        $steps = $definition->steps;

        if ($steps->isEmpty()) {
            return [[
                'code' => 'GRAPH_EMPTY',
                'message' => 'O fluxo precisa ter ao menos uma etapa.',
            ]];
        }

        $startSteps = $steps->where('is_start', true)->values();

        if ($startSteps->count() !== 1) {
            $errors[] = [
                'code' => 'START_STEP_COUNT_INVALID',
                'message' => 'O fluxo precisa ter exatamente uma etapa inicial.',
                'meta' => ['start_steps' => $startSteps->count()],
            ];
        }

        $stepIds = $steps->pluck('id')->all();
        $adjacency = $steps->mapWithKeys(fn (WorkflowStep $step) => [
            $step->id => $step->outgoingTransitions->pluck('to_step_id')->all(),
        ])->all();

        if ($startSteps->count() === 1) {
            $reachable = $this->reachableStepIds($startSteps->first()->id, $adjacency);
            $orphans = array_values(array_diff($stepIds, $reachable));

            foreach ($orphans as $stepId) {
                $errors[] = [
                    'code' => 'STEP_ORPHAN',
                    'message' => 'Existe etapa nao alcancavel a partir da etapa inicial.',
                    'meta' => ['step_id' => $stepId],
                ];
            }

            foreach ($steps as $step) {
                if (! in_array($step->id, $reachable, true)) {
                    continue;
                }

                if ($this->hasCycleFrom($step->id, $adjacency)) {
                    $errors[] = [
                        'code' => 'GRAPH_CYCLE',
                        'message' => 'O fluxo possui ciclo; todo caminho precisa chegar a uma etapa terminal.',
                        'meta' => ['step_id' => $step->id],
                    ];
                    break;
                }

                if (! $this->canReachTerminal($step->id, $adjacency)) {
                    $errors[] = [
                        'code' => 'NO_TERMINAL_PATH',
                        'message' => 'Existe etapa sem caminho para uma etapa terminal.',
                        'meta' => ['step_id' => $step->id],
                    ];
                }
            }
        }

        return [
            ...$errors,
            ...$this->validateConditions($definition),
        ];
    }

    /**
     * @param  array<int, list<int>>  $adjacency
     * @return list<int>
     */
    private function reachableStepIds(int $startStepId, array $adjacency): array
    {
        $visited = [];
        $stack = [$startStepId];

        while ($stack !== []) {
            $stepId = array_pop($stack);

            if (in_array($stepId, $visited, true)) {
                continue;
            }

            $visited[] = $stepId;

            foreach ($adjacency[$stepId] ?? [] as $nextStepId) {
                $stack[] = $nextStepId;
            }
        }

        return $visited;
    }

    /**
     * @param  array<int, list<int>>  $adjacency
     */
    private function hasCycleFrom(int $stepId, array $adjacency, array $visiting = [], array $visited = []): bool
    {
        if (in_array($stepId, $visiting, true)) {
            return true;
        }

        if (in_array($stepId, $visited, true)) {
            return false;
        }

        $visiting[] = $stepId;

        foreach ($adjacency[$stepId] ?? [] as $nextStepId) {
            if ($this->hasCycleFrom($nextStepId, $adjacency, $visiting, [...$visited, $stepId])) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param  array<int, list<int>>  $adjacency
     */
    private function canReachTerminal(int $stepId, array $adjacency, array $visited = []): bool
    {
        if (in_array($stepId, $visited, true)) {
            return false;
        }

        $nextStepIds = $adjacency[$stepId] ?? [];

        if ($nextStepIds === []) {
            return true;
        }

        foreach ($nextStepIds as $nextStepId) {
            if ($this->canReachTerminal($nextStepId, $adjacency, [...$visited, $stepId])) {
                return true;
            }
        }

        return false;
    }

    /**
     * @return list<array{code: string, message: string, meta?: array<string, mixed>}>
     */
    private function validateConditions(WorkflowDefinition $definition): array
    {
        $expressionLanguage = new ExpressionLanguage;
        $variables = $definition->formFields->pluck('key')->all();
        $errors = [];

        foreach ($definition->transitions as $transition) {
            if (! $transition->condition_expression) {
                continue;
            }

            try {
                $expressionLanguage->parse($transition->condition_expression, $variables);
            } catch (Throwable $exception) {
                $errors[] = [
                    'code' => 'CONDITION_SYNTAX_INVALID',
                    'message' => 'Existe condicao com sintaxe invalida.',
                    'meta' => [
                        'transition_id' => $transition->id,
                        'error' => $exception->getMessage(),
                    ],
                ];
            }
        }

        return $errors;
    }
}
