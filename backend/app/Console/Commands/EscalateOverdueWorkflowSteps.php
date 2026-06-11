<?php

namespace App\Console\Commands;

use App\Domain\Workflow\Services\WorkflowEscalationService;
use Illuminate\Console\Command;

class EscalateOverdueWorkflowSteps extends Command
{
    protected $signature = 'workflow:escalate-overdue';

    protected $description = 'Escalate workflow steps whose SLA is overdue.';

    public function handle(WorkflowEscalationService $escalationService): int
    {
        $count = $escalationService->escalateOverdueSteps();

        $this->info("Escalated {$count} overdue workflow step(s).");

        return self::SUCCESS;
    }
}
