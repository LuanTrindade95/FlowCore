<?php

use App\Domain\Workflow\Enums\ApprovalMode;
use App\Domain\Workflow\Enums\AssigneeType;
use App\Domain\Workflow\Enums\InstanceStepStatus;
use App\Domain\Workflow\Enums\WorkflowActionType;
use App\Domain\Workflow\Enums\WorkflowDefinitionStatus;
use App\Domain\Workflow\Enums\WorkflowStepType;
use App\Domain\Workflow\Services\WorkflowEscalationService;
use App\Events\RuntimeWorkflowUpdated;
use App\Models\InstanceStep;
use App\Models\StepApprover;
use App\Models\User;
use App\Models\WorkflowDefinition;
use App\Models\WorkflowInstance;
use App\Models\WorkflowStep;
use Database\Seeders\RbacSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;

uses(RefreshDatabase::class);

function realtimeAutomationUser(string $role): User
{
    $user = User::factory()->create();
    $user->assignRole($role);

    return $user;
}

function realtimeAutomationRuntime(): array
{
    $definition = WorkflowDefinition::factory()->create([
        'status' => WorkflowDefinitionStatus::Published,
    ]);
    $step = WorkflowStep::factory()->create([
        'workflow_definition_id' => $definition->id,
        'type' => WorkflowStepType::Approval,
        'is_start' => true,
        'sla_hours' => 1,
    ]);
    StepApprover::create([
        'workflow_step_id' => $step->id,
        'assignee_type' => AssigneeType::Role,
        'assignee_ref' => 'approver',
        'approval_mode' => ApprovalMode::Any,
    ]);

    return [$definition, $step];
}

beforeEach(function () {
    $this->seed(RbacSeeder::class);
});

it('escalates overdue steps once and broadcasts to visible runtime users', function () {
    Event::fake([RuntimeWorkflowUpdated::class]);
    $requester = realtimeAutomationUser('requester');
    $approver = realtimeAutomationUser('approver');
    $admin = realtimeAutomationUser('admin');
    [$definition, $step] = realtimeAutomationRuntime();
    $instance = WorkflowInstance::factory()->create([
        'workflow_definition_id' => $definition->id,
        'requester_id' => $requester->id,
        'current_step_id' => $step->id,
    ]);
    $instanceStep = InstanceStep::factory()->create([
        'workflow_instance_id' => $instance->id,
        'workflow_step_id' => $step->id,
        'assigned_to' => $approver->id,
        'status' => InstanceStepStatus::InProgress,
        'due_at' => now()->subMinute(),
    ]);

    $service = app(WorkflowEscalationService::class);

    expect($service->escalateOverdueSteps())->toBe(1)
        ->and($instanceStep->refresh()->status)->toBe(InstanceStepStatus::Escalated)
        ->and($instance->actions()->where('action', WorkflowActionType::Escalated)->count())->toBe(1)
        ->and($service->escalateOverdueSteps())->toBe(0)
        ->and($instance->actions()->where('action', WorkflowActionType::Escalated)->count())->toBe(1);

    Event::assertDispatched(RuntimeWorkflowUpdated::class, function (RuntimeWorkflowUpdated $event) use ($requester, $approver, $admin, $instance, $instanceStep) {
        return $event->workflowInstanceId === $instance->id
            && $event->instanceStepId === $instanceStep->id
            && $event->action === WorkflowActionType::Escalated
            && collect($event->recipientUserIds)->sort()->values()->all() === collect([
                $requester->id,
                $approver->id,
                $admin->id,
            ])->sort()->values()->all();
    });
});

it('does not escalate open steps before the sla deadline or closed steps', function () {
    [$definition, $step] = realtimeAutomationRuntime();
    $requester = realtimeAutomationUser('requester');

    $instance = WorkflowInstance::factory()->create([
        'workflow_definition_id' => $definition->id,
        'requester_id' => $requester->id,
        'current_step_id' => $step->id,
    ]);
    InstanceStep::factory()->create([
        'workflow_instance_id' => $instance->id,
        'workflow_step_id' => $step->id,
        'status' => InstanceStepStatus::InProgress,
        'due_at' => now()->addMinute(),
    ]);
    InstanceStep::factory()->create([
        'workflow_instance_id' => $instance->id,
        'workflow_step_id' => $step->id,
        'status' => InstanceStepStatus::Approved,
        'due_at' => now()->subMinute(),
    ]);

    expect(app(WorkflowEscalationService::class)->escalateOverdueSteps())->toBe(0)
        ->and($instance->actions()->where('action', WorkflowActionType::Escalated)->exists())->toBeFalse();
});

it('exposes an artisan command for scheduled escalation', function () {
    [$definition, $step] = realtimeAutomationRuntime();
    $requester = realtimeAutomationUser('requester');
    $instance = WorkflowInstance::factory()->create([
        'workflow_definition_id' => $definition->id,
        'requester_id' => $requester->id,
        'current_step_id' => $step->id,
    ]);
    InstanceStep::factory()->create([
        'workflow_instance_id' => $instance->id,
        'workflow_step_id' => $step->id,
        'status' => InstanceStepStatus::InProgress,
        'due_at' => now()->subMinute(),
    ]);

    $this->artisan('workflow:escalate-overdue')
        ->expectsOutput('Escalated 1 overdue workflow step(s).')
        ->assertSuccessful();
});

it('authorizes only the authenticated user runtime channel', function () {
    $user = realtimeAutomationUser('approver');
    $other = realtimeAutomationUser('approver');
    $token = $user->createToken('broadcast-test')->plainTextToken;

    $this->withToken($token)->postJson('/broadcasting/auth', [
        'socket_id' => '123.456',
        'channel_name' => "private-users.{$user->id}.runtime",
    ])->assertOk();

    $this->withToken($token)->postJson('/broadcasting/auth', [
        'socket_id' => '123.456',
        'channel_name' => "private-users.{$other->id}.runtime",
    ])->assertForbidden();
});
