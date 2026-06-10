<?php

use App\Domain\Workflow\Enums\ApprovalMode;
use App\Domain\Workflow\Enums\AssigneeType;
use App\Domain\Workflow\Enums\FormFieldType;
use App\Domain\Workflow\Enums\InstanceStepDecisionValue;
use App\Domain\Workflow\Enums\TransitionEvent;
use App\Domain\Workflow\Enums\WorkflowDefinitionStatus;
use App\Domain\Workflow\Enums\WorkflowInstanceStatus;
use App\Domain\Workflow\Enums\WorkflowStepType;
use App\Domain\Workflow\Exceptions\WorkflowEngineException;
use App\Domain\Workflow\Services\WorkflowEngine;
use App\Models\FormField;
use App\Models\InstanceStep;
use App\Models\StepApprover;
use App\Models\User;
use App\Models\WorkflowDefinition;
use App\Models\WorkflowStep;
use App\Models\WorkflowTransition;
use Database\Seeders\RbacSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function workflowEngineUsers(int $approvers = 1): array
{
    test()->seed(RbacSeeder::class);

    $requester = User::factory()->create();
    $requester->assignRole('requester');

    $approverUsers = User::factory($approvers)->create();
    $approverUsers->each(fn (User $user) => $user->assignRole('approver'));

    return [$requester, ...$approverUsers->all()];
}

function publishedDefinition(string $slug = 'engine-flow'): WorkflowDefinition
{
    return WorkflowDefinition::create([
        'name' => 'Engine Flow',
        'slug' => $slug,
        'description' => 'Flow for engine tests.',
        'version' => 1,
        'status' => WorkflowDefinitionStatus::Published,
        'category' => 'QA',
    ]);
}

function engineStep(
    WorkflowDefinition $definition,
    string $key,
    bool $start = false,
    ApprovalMode $mode = ApprovalMode::Any,
    ?int $quorum = null,
): WorkflowStep {
    $step = WorkflowStep::create([
        'workflow_definition_id' => $definition->id,
        'key' => $key,
        'name' => $key,
        'type' => WorkflowStepType::Approval,
        'order' => WorkflowStep::where('workflow_definition_id', $definition->id)->count() + 1,
        'config' => [],
        'sla_hours' => 24,
        'is_start' => $start,
    ]);

    StepApprover::create([
        'workflow_step_id' => $step->id,
        'assignee_type' => AssigneeType::Role,
        'assignee_ref' => 'approver',
        'approval_mode' => $mode,
        'quorum_n' => $quorum,
    ]);

    return $step;
}

function engineTransition(
    WorkflowDefinition $definition,
    WorkflowStep $from,
    WorkflowStep $to,
    TransitionEvent $event = TransitionEvent::Approved,
    ?string $condition = null,
): void {
    WorkflowTransition::create([
        'workflow_definition_id' => $definition->id,
        'from_step_id' => $from->id,
        'to_step_id' => $to->id,
        'on_event' => $event,
        'condition_expression' => $condition,
    ]);
}

it('runs a linear three-step workflow from submit to approved with timeline actions', function () {
    [$requester, $approver] = workflowEngineUsers();
    $definition = publishedDefinition();
    $first = engineStep($definition, 'first', true);
    $second = engineStep($definition, 'second');
    $third = engineStep($definition, 'third');
    engineTransition($definition, $first, $second);
    engineTransition($definition, $second, $third);

    $engine = app(WorkflowEngine::class);
    $instance = $engine->start($definition, $requester, []);

    foreach ([$first, $second, $third] as $step) {
        $instanceStep = InstanceStep::where('workflow_instance_id', $instance->id)
            ->where('workflow_step_id', $step->id)
            ->firstOrFail();
        $instance = $engine->decide($instanceStep, $approver, InstanceStepDecisionValue::Approve);
    }

    expect($instance->refresh()->status)->toBe(WorkflowInstanceStatus::Approved)
        ->and($instance->actions()->count())->toBeGreaterThanOrEqual(6);
});

it('routes conditional branches from workflow data', function () {
    [$requester, $approver] = workflowEngineUsers();
    $definition = publishedDefinition('conditional-flow');
    FormField::create([
        'workflow_definition_id' => $definition->id,
        'key' => 'amount',
        'label' => 'Amount',
        'type' => FormFieldType::Number,
        'required' => true,
        'order' => 1,
    ]);
    $start = engineStep($definition, 'start', true);
    $high = engineStep($definition, 'high_value');
    $low = engineStep($definition, 'low_value');
    engineTransition($definition, $start, $high, condition: 'amount > 1000');
    engineTransition($definition, $start, $low, condition: 'amount <= 1000');

    $engine = app(WorkflowEngine::class);

    $highInstance = $engine->start($definition, $requester, ['amount' => 1500]);
    $engine->decide($highInstance->steps()->firstOrFail(), $approver, InstanceStepDecisionValue::Approve);

    $lowInstance = $engine->start($definition, $requester, ['amount' => 200]);
    $engine->decide($lowInstance->steps()->firstOrFail(), $approver, InstanceStepDecisionValue::Approve);

    expect($highInstance->refresh()->current_step_id)->toBe($high->id)
        ->and($lowInstance->refresh()->current_step_id)->toBe($low->id);
});

it('requires all approvers when approval mode is all', function () {
    [$requester, $approverA, $approverB] = workflowEngineUsers(2);
    $definition = publishedDefinition('all-flow');
    $start = engineStep($definition, 'start', true, ApprovalMode::All);
    $engine = app(WorkflowEngine::class);
    $instance = $engine->start($definition, $requester, []);
    $instanceStep = $instance->steps()->firstOrFail();

    $engine->decide($instanceStep, $approverA, InstanceStepDecisionValue::Approve);
    expect($instance->refresh()->status)->toBe(WorkflowInstanceStatus::Running)
        ->and($instanceStep->refresh()->decisions_count)->toBe(1);

    $engine->decide($instanceStep, $approverB, InstanceStepDecisionValue::Approve);
    expect($instance->refresh()->status)->toBe(WorkflowInstanceStatus::Approved);
});

it('closes quorum steps when the required number of approvals is reached', function () {
    [$requester, $approverA, $approverB] = workflowEngineUsers(3);
    $definition = publishedDefinition('quorum-flow');
    engineStep($definition, 'start', true, ApprovalMode::Quorum, 2);
    $engine = app(WorkflowEngine::class);
    $instance = $engine->start($definition, $requester, []);
    $instanceStep = $instance->steps()->firstOrFail();

    $engine->decide($instanceStep, $approverA, InstanceStepDecisionValue::Approve);
    $engine->decide($instanceStep, $approverB, InstanceStepDecisionValue::Approve);

    expect($instance->refresh()->status)->toBe(WorkflowInstanceStatus::Approved)
        ->and($instanceStep->refresh()->decisions_count)->toBe(2);
});

it('terminates the instance as rejected when a rejection has no configured transition', function () {
    [$requester, $approver] = workflowEngineUsers();
    $definition = publishedDefinition('rejection-flow');
    engineStep($definition, 'start', true);
    $engine = app(WorkflowEngine::class);
    $instance = $engine->start($definition, $requester, []);

    $engine->decide($instance->steps()->firstOrFail(), $approver, InstanceStepDecisionValue::Reject);

    expect($instance->refresh()->status)->toBe(WorkflowInstanceStatus::Rejected);
});

it('reassigns active steps and records the action', function () {
    [$requester, $approverA, $approverB] = workflowEngineUsers(2);
    $definition = publishedDefinition('reassign-flow');
    engineStep($definition, 'start', true);
    $engine = app(WorkflowEngine::class);
    $instance = $engine->start($definition, $requester, []);
    $instanceStep = $instance->steps()->firstOrFail();

    $engine->reassign($instanceStep, $approverA, $approverB);

    expect($instanceStep->refresh()->assigned_to)->toBe($approverB->id)
        ->and($instance->actions()->where('action', 'reassigned')->exists())->toBeTrue();
});

it('pins workflow instances to the published definition version used at start', function () {
    [$requester] = workflowEngineUsers();
    $definition = publishedDefinition('version-pin-flow');
    engineStep($definition, 'start', true);

    $instance = app(WorkflowEngine::class)->start($definition, $requester, []);
    $definition->update(['version' => 2]);

    expect($instance->refresh()->definition_version)->toBe(1);
});

it('blocks malicious condition expressions through the expression sandbox', function () {
    [$requester, $approver] = workflowEngineUsers();
    $definition = publishedDefinition('malicious-flow');
    $start = engineStep($definition, 'start', true);
    $next = engineStep($definition, 'next');
    engineTransition($definition, $start, $next, condition: 'system("whoami")');

    $engine = app(WorkflowEngine::class);
    $instance = $engine->start($definition, $requester, []);

    $engine->decide($instance->steps()->firstOrFail(), $approver, InstanceStepDecisionValue::Approve);
})->throws(WorkflowEngineException::class);

it('guards against excessive graph depth', function () {
    [$requester] = workflowEngineUsers();
    $definition = publishedDefinition('depth-flow');
    $start = engineStep($definition, 'start', true);
    $instance = app(WorkflowEngine::class)->start($definition, $requester, []);

    app(WorkflowEngine::class)->advance($instance, $start, TransitionEvent::Approved, 51);
})->throws(WorkflowEngineException::class);

it('does not count duplicate or late decisions after a quorum step is closed', function () {
    [$requester, $approverA, $approverB] = workflowEngineUsers(2);
    $definition = publishedDefinition('concurrency-flow');
    engineStep($definition, 'start', true, ApprovalMode::Quorum, 1);
    $engine = app(WorkflowEngine::class);
    $instance = $engine->start($definition, $requester, []);
    $instanceStep = $instance->steps()->firstOrFail();

    $engine->decide($instanceStep, $approverA, InstanceStepDecisionValue::Approve);

    expect(fn () => $engine->decide($instanceStep, $approverB, InstanceStepDecisionValue::Approve))
        ->toThrow(WorkflowEngineException::class);

    expect($instanceStep->refresh()->decisions_count)->toBe(1)
        ->and($instance->refresh()->status)->toBe(WorkflowInstanceStatus::Approved);
});
