<?php

use App\Domain\Workflow\Enums\ApprovalMode;
use App\Domain\Workflow\Enums\AssigneeType;
use App\Domain\Workflow\Enums\FormFieldType;
use App\Domain\Workflow\Enums\InstanceStepStatus;
use App\Domain\Workflow\Enums\WorkflowDefinitionStatus;
use App\Domain\Workflow\Enums\WorkflowInstanceStatus;
use App\Domain\Workflow\Enums\WorkflowStepType;
use App\Models\FormField;
use App\Models\InstanceStep;
use App\Models\StepApprover;
use App\Models\User;
use App\Models\WorkflowDefinition;
use App\Models\WorkflowInstance;
use App\Models\WorkflowStep;
use Database\Seeders\RbacSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function runtimeUser(string $role): User
{
    $user = User::factory()->create();
    $user->assignRole($role);

    return $user;
}

function runtimeDefinition(string $slug = 'runtime-flow', int $version = 1): WorkflowDefinition
{
    return WorkflowDefinition::factory()->create([
        'name' => 'Runtime Flow',
        'slug' => $slug,
        'version' => $version,
        'status' => WorkflowDefinitionStatus::Published,
    ]);
}

function runtimeStep(WorkflowDefinition $definition, string $key = 'approval'): WorkflowStep
{
    $step = WorkflowStep::factory()->create([
        'workflow_definition_id' => $definition->id,
        'key' => $key,
        'name' => 'Aprovacao Financeira',
        'type' => WorkflowStepType::Approval,
        'order' => 1,
        'is_start' => true,
    ]);

    StepApprover::create([
        'workflow_step_id' => $step->id,
        'assignee_type' => AssigneeType::Role,
        'assignee_ref' => 'approver',
        'approval_mode' => ApprovalMode::Any,
        'quorum_n' => null,
    ]);

    return $step;
}

beforeEach(function () {
    $this->seed(RbacSeeder::class);
});

it('lists only the latest published workflow version with ordered form schema', function () {
    $requester = runtimeUser('requester');
    $old = runtimeDefinition('purchase', 1);
    $latest = runtimeDefinition('purchase', 2);
    WorkflowDefinition::factory()->create([
        'slug' => 'draft-only',
        'status' => WorkflowDefinitionStatus::Draft,
    ]);

    FormField::create([
        'workflow_definition_id' => $latest->id,
        'key' => 'priority',
        'label' => 'Prioridade',
        'type' => FormFieldType::Select,
        'required' => true,
        'options' => ['Baixa', 'Alta'],
        'order' => 2,
    ]);
    FormField::create([
        'workflow_definition_id' => $latest->id,
        'key' => 'amount',
        'label' => 'Valor',
        'type' => FormFieldType::Number,
        'required' => true,
        'options' => null,
        'order' => 1,
    ]);

    $response = $this->actingAs($requester)->getJson('/api/v1/runtime/workflows')->assertOk();

    expect($response->json('data'))->toHaveCount(1)
        ->and($response->json('data.0.id'))->toBe($latest->id)
        ->and($response->json('data.0.form_fields.0.key'))->toBe('amount')
        ->and($response->json('data.0.form_fields.1.key'))->toBe('priority')
        ->and($response->json('data.0.id'))->not->toBe($old->id);
});

it('normalizes legacy nested select options for runtime clients', function () {
    $requester = runtimeUser('requester');
    $definition = runtimeDefinition('legacy-options');
    FormField::create([
        'workflow_definition_id' => $definition->id,
        'key' => 'cost_center',
        'label' => 'Centro de custo',
        'type' => FormFieldType::Select,
        'required' => true,
        'options' => ['options' => ['Tecnologia', 'Financeiro']],
        'order' => 1,
    ]);

    $this->actingAs($requester)->getJson('/api/v1/runtime/workflows')
        ->assertOk()
        ->assertJsonPath('data.0.form_fields.0.options', ['Tecnologia', 'Financeiro']);
});

it('isolates requester lists and details while allowing view-all users', function () {
    $requesterA = runtimeUser('requester');
    $requesterB = runtimeUser('requester');
    $admin = runtimeUser('admin');
    $definition = runtimeDefinition();

    $instanceA = WorkflowInstance::factory()->create([
        'workflow_definition_id' => $definition->id,
        'requester_id' => $requesterA->id,
    ]);
    $instanceB = WorkflowInstance::factory()->create([
        'workflow_definition_id' => $definition->id,
        'requester_id' => $requesterB->id,
    ]);

    $requesterResponse = $this->actingAs($requesterA)->getJson('/api/v1/requests')->assertOk();
    expect(collect($requesterResponse->json('data'))->pluck('id')->all())->toBe([$instanceA->id]);

    $this->actingAs($requesterA)->getJson("/api/v1/requests/{$instanceB->id}")->assertForbidden();

    $adminResponse = $this->actingAs($admin)->getJson('/api/v1/requests')->assertOk();
    expect(collect($adminResponse->json('data'))->pluck('id'))->toContain($instanceA->id, $instanceB->id);
});

it('filters requests by status workflow ownership and period', function () {
    $admin = runtimeUser('admin');
    $definitionA = runtimeDefinition('filter-a');
    $definitionB = runtimeDefinition('filter-b');
    $requester = runtimeUser('requester');

    $matching = WorkflowInstance::factory()->create([
        'workflow_definition_id' => $definitionA->id,
        'requester_id' => $requester->id,
        'status' => WorkflowInstanceStatus::Running,
        'started_at' => now()->subDay(),
    ]);
    WorkflowInstance::factory()->create([
        'workflow_definition_id' => $definitionB->id,
        'requester_id' => $requester->id,
        'status' => WorkflowInstanceStatus::Approved,
        'started_at' => now()->subDays(10),
    ]);

    $query = http_build_query([
        'status' => 'running',
        'workflow_definition_id' => $definitionA->id,
        'from' => now()->subDays(2)->format('Y-m-d'),
        'to' => now()->format('Y-m-d'),
    ]);

    $response = $this->actingAs($admin)->getJson("/api/v1/requests?{$query}")->assertOk();

    expect($response->json('data'))->toHaveCount(1)
        ->and($response->json('data.0.id'))->toBe($matching->id)
        ->and($response->json('data.0.definition.name'))->toBe('Runtime Flow');
});

it('returns actionable inbox context and scoped dashboard metrics', function () {
    $approver = runtimeUser('approver');
    $requester = runtimeUser('requester');
    $definition = runtimeDefinition('inbox-flow');
    $step = runtimeStep($definition);
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
        'approval_mode' => ApprovalMode::Quorum,
        'decisions_needed' => 2,
        'decisions_count' => 1,
        'due_at' => now()->subHour(),
    ]);

    $inbox = $this->actingAs($approver)->getJson('/api/v1/inbox')->assertOk();
    $inbox->assertJsonPath('data.0.id', $instanceStep->id)
        ->assertJsonPath('data.0.step.name', 'Aprovacao Financeira')
        ->assertJsonPath('data.0.instance.definition.name', 'Runtime Flow')
        ->assertJsonPath('data.0.actions.decide', true)
        ->assertJsonPath('data.0.actions.reassign', true)
        ->assertJsonPath('data.0.actions.comment', true);

    $dashboard = $this->actingAs($approver)->getJson('/api/v1/dashboard')->assertOk();
    $dashboard->assertJsonPath('pending', 1)
        ->assertJsonPath('overdue', 1)
        ->assertJsonPath('active', 1);
});

it('does not advertise decision actions for closed steps', function () {
    $approver = runtimeUser('approver');
    $requester = runtimeUser('requester');
    $definition = runtimeDefinition('closed-actions-flow');
    $step = runtimeStep($definition);
    $instance = WorkflowInstance::factory()->create([
        'workflow_definition_id' => $definition->id,
        'requester_id' => $requester->id,
        'status' => WorkflowInstanceStatus::Approved,
        'current_step_id' => null,
    ]);
    InstanceStep::factory()->create([
        'workflow_instance_id' => $instance->id,
        'workflow_step_id' => $step->id,
        'assigned_to' => $approver->id,
        'status' => InstanceStepStatus::Approved,
    ]);

    $response = $this->actingAs($approver)->getJson("/api/v1/requests/{$instance->id}")
        ->assertOk();

    $response
        ->assertJsonPath('steps.0.actions.decide', false)
        ->assertJsonPath('steps.0.actions.reassign', false)
        ->assertJsonPath('steps.0.actions.comment', false);
});

it('validates runtime data against published form field types and options', function () {
    $requester = runtimeUser('requester');
    $definition = runtimeDefinition('validation-flow');
    runtimeStep($definition);

    FormField::create([
        'workflow_definition_id' => $definition->id,
        'key' => 'amount',
        'label' => 'Valor',
        'type' => FormFieldType::Number,
        'required' => true,
        'order' => 1,
    ]);
    FormField::create([
        'workflow_definition_id' => $definition->id,
        'key' => 'priority',
        'label' => 'Prioridade',
        'type' => FormFieldType::Select,
        'required' => true,
        'options' => ['Baixa', 'Alta'],
        'order' => 2,
    ]);

    $this->actingAs($requester)->postJson('/api/v1/requests', [
        'workflow_definition_id' => $definition->id,
        'data' => ['amount' => 'not-a-number', 'priority' => 'Invalida'],
    ])->assertUnprocessable()
        ->assertJsonValidationErrors(['amount', 'priority']);

    $this->actingAs($requester)->postJson('/api/v1/requests', [
        'workflow_definition_id' => $definition->id,
        'data' => ['amount' => 100, 'priority' => 'Alta', 'unexpected' => true],
    ])->assertUnprocessable()
        ->assertJsonValidationErrors(['data']);
});
