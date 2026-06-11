<?php

use App\Models\FormField;
use App\Models\StepApprover;
use App\Models\User;
use App\Models\WorkflowDefinition;
use App\Models\WorkflowInstance;
use App\Models\WorkflowStep;
use App\Models\WorkflowTransition;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('keeps the demo portfolio dataset idempotent', function () {
    $this->seed(DatabaseSeeder::class);
    $firstRun = demoSeederCounts();

    $this->seed(DatabaseSeeder::class);

    expect(demoSeederCounts())->toBe($firstRun)
        ->and(User::whereIn('email', [
            'admin@demo.com',
            'approver@demo.com',
            'requester@demo.com',
        ])->count())->toBe(3)
        ->and(WorkflowDefinition::where('status', 'published')->pluck('slug')->sort()->values()->all())->toBe([
            'aprovacao-de-compra',
            'pedido-de-ferias',
        ]);
});

function demoSeederCounts(): array
{
    return [
        'users' => User::count(),
        'workflow_definitions' => WorkflowDefinition::count(),
        'workflow_steps' => WorkflowStep::count(),
        'step_approvers' => StepApprover::count(),
        'form_fields' => FormField::count(),
        'workflow_transitions' => WorkflowTransition::count(),
        'workflow_instances' => WorkflowInstance::count(),
    ];
}
