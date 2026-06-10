<?php

use App\Domain\Workflow\Enums\ApprovalMode;
use App\Domain\Workflow\Enums\InstanceStepStatus;
use App\Domain\Workflow\Enums\WorkflowDefinitionStatus;
use App\Domain\Workflow\Enums\WorkflowInstanceStatus;
use App\Domain\Workflow\Enums\WorkflowStepType;
use App\Domain\Workflow\Exceptions\InvalidWorkflowStateTransition;
use App\Models\InstanceStep;
use App\Models\User;
use App\Models\WorkflowDefinition;
use App\Models\WorkflowInstance;
use App\Models\WorkflowStep;
use Database\Seeders\RbacSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function workflowDefinitionForTests(): WorkflowDefinition
{
    return WorkflowDefinition::create([
        'name' => 'Fluxo de Teste',
        'slug' => 'fluxo-de-teste',
        'description' => 'Fluxo usado pelos testes de dominio.',
        'version' => 1,
        'status' => WorkflowDefinitionStatus::Published,
        'category' => 'QA',
    ]);
}

function workflowStepForTests(WorkflowDefinition $definition): WorkflowStep
{
    return WorkflowStep::create([
        'workflow_definition_id' => $definition->id,
        'key' => 'approval',
        'name' => 'Aprovacao',
        'type' => WorkflowStepType::Approval,
        'order' => 1,
        'config' => [],
        'sla_hours' => 24,
        'is_start' => true,
    ]);
}

it('allows valid workflow instance transitions', function () {
    $definition = workflowDefinitionForTests();
    $requester = User::factory()->create();

    $instance = WorkflowInstance::create([
        'workflow_definition_id' => $definition->id,
        'definition_version' => 1,
        'requester_id' => $requester->id,
        'status' => WorkflowInstanceStatus::Running,
        'data' => ['amount' => 1200],
        'started_at' => now(),
    ]);

    $instance->transitionTo(WorkflowInstanceStatus::Approved);

    expect($instance->refresh()->status)->toBe(WorkflowInstanceStatus::Approved)
        ->and($instance->finished_at)->not->toBeNull();
});

it('rejects invalid workflow instance transitions', function () {
    $definition = workflowDefinitionForTests();
    $requester = User::factory()->create();

    $instance = WorkflowInstance::create([
        'workflow_definition_id' => $definition->id,
        'definition_version' => 1,
        'requester_id' => $requester->id,
        'status' => WorkflowInstanceStatus::Approved,
        'data' => [],
        'started_at' => now()->subHour(),
        'finished_at' => now(),
    ]);

    $instance->transitionTo(WorkflowInstanceStatus::Running);
})->throws(InvalidWorkflowStateTransition::class);

it('allows valid instance step transitions', function () {
    $definition = workflowDefinitionForTests();
    $step = workflowStepForTests($definition);
    $requester = User::factory()->create();
    $approver = User::factory()->create();
    $instance = WorkflowInstance::factory()->create([
        'workflow_definition_id' => $definition->id,
        'definition_version' => 1,
        'requester_id' => $requester->id,
        'current_step_id' => $step->id,
    ]);

    $instanceStep = InstanceStep::create([
        'workflow_instance_id' => $instance->id,
        'workflow_step_id' => $step->id,
        'status' => InstanceStepStatus::Pending,
        'assigned_to' => $approver->id,
        'approval_mode' => ApprovalMode::Any,
        'decisions_needed' => 1,
        'decisions_count' => 0,
    ]);

    $instanceStep->transitionTo(InstanceStepStatus::InProgress);
    $instanceStep->transitionTo(InstanceStepStatus::Approved);

    expect($instanceStep->refresh()->status)->toBe(InstanceStepStatus::Approved)
        ->and($instanceStep->completed_at)->not->toBeNull();
});

it('rejects invalid instance step transitions', function () {
    $definition = workflowDefinitionForTests();
    $step = workflowStepForTests($definition);
    $requester = User::factory()->create();
    $instance = WorkflowInstance::factory()->create([
        'workflow_definition_id' => $definition->id,
        'definition_version' => 1,
        'requester_id' => $requester->id,
        'current_step_id' => $step->id,
    ]);

    $instanceStep = InstanceStep::create([
        'workflow_instance_id' => $instance->id,
        'workflow_step_id' => $step->id,
        'status' => InstanceStepStatus::Approved,
        'approval_mode' => ApprovalMode::Any,
        'decisions_needed' => 1,
        'decisions_count' => 1,
        'completed_at' => now(),
    ]);

    $instanceStep->transitionTo(InstanceStepStatus::InProgress);
})->throws(InvalidWorkflowStateTransition::class);

it('seeds role permissions without granting workflow management to requester', function () {
    $this->seed(RbacSeeder::class);

    $admin = User::factory()->create();
    $requester = User::factory()->create();

    $admin->assignRole('admin');
    $requester->assignRole('requester');

    expect($admin->can('workflows.manage'))->toBeTrue()
        ->and($requester->can('workflows.manage'))->toBeFalse()
        ->and($requester->can('requests.create'))->toBeTrue();
});
