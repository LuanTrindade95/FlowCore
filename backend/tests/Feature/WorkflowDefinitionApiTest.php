<?php

use App\Models\User;
use App\Models\WorkflowDefinition;
use Database\Seeders\RbacSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function adminTokenForWorkflowApi(): string
{
    test()->seed(RbacSeeder::class);

    $admin = User::factory()->create();
    $admin->assignRole('admin');

    return $admin->createToken('workflow-api-test')->plainTextToken;
}

function createWorkflowDraft(string $token, string $slug = 'fluxo-api'): int
{
    return test()->withToken($token)->postJson('/api/v1/workflows', [
        'name' => 'Fluxo API',
        'slug' => $slug,
        'description' => 'Fluxo criado pelo teste.',
        'category' => 'QA',
    ])->assertCreated()->json('data.id');
}

function createStep(string $token, int $workflowId, string $key, bool $isStart, int $order = 1): int
{
    return test()->withToken($token)->postJson("/api/v1/workflows/{$workflowId}/steps", [
        'key' => $key,
        'name' => str_replace('_', ' ', ucfirst($key)),
        'type' => 'approval',
        'order' => $order,
        'config' => [],
        'sla_hours' => 24,
        'is_start' => $isStart,
    ])->assertCreated()->json('data.id');
}

function createTransition(string $token, int $workflowId, int $fromStepId, int $toStepId, ?string $condition = null): int
{
    return test()->withToken($token)->postJson("/api/v1/workflows/{$workflowId}/transitions", [
        'from_step_id' => $fromStepId,
        'to_step_id' => $toStepId,
        'on_event' => 'approved',
        'condition_expression' => $condition,
    ])->assertCreated()->json('data.id');
}

it('creates a workflow graph and publishes a valid draft as an immutable version', function () {
    $token = adminTokenForWorkflowApi();
    $workflowId = createWorkflowDraft($token);
    $startStepId = createStep($token, $workflowId, 'start_approval', true);
    $endStepId = createStep($token, $workflowId, 'final_notification', false, 2);

    createTransition($token, $workflowId, $startStepId, $endStepId);

    $published = $this->withToken($token)->postJson("/api/v1/workflows/{$workflowId}/publish")
        ->assertOk()
        ->assertJsonPath('data.status', 'published')
        ->assertJsonPath('data.version', 1)
        ->json('data');

    expect($published['steps'])->toHaveCount(2)
        ->and($published['transitions'])->toHaveCount(1);

    $this->withToken($token)->patchJson("/api/v1/workflows/{$workflowId}", [
        'name' => 'Tentativa de editar publicado',
        'slug' => 'fluxo-api',
    ])->assertUnprocessable()
        ->assertJsonPath('code', 'VALIDATION_ERROR');
});

it('rejects publishing a graph with an orphan step', function () {
    $token = adminTokenForWorkflowApi();
    $workflowId = createWorkflowDraft($token, 'fluxo-com-orfao');
    $startStepId = createStep($token, $workflowId, 'start_approval', true);
    $endStepId = createStep($token, $workflowId, 'terminal_step', false, 2);
    createStep($token, $workflowId, 'orphan_step', false, 3);
    createTransition($token, $workflowId, $startStepId, $endStepId);

    $response = $this->withToken($token)->postJson("/api/v1/workflows/{$workflowId}/publish");

    $response->assertUnprocessable();
    expect($response->json('errors.graph'))->sequence(
        fn ($error) => $error->code->toBe('STEP_ORPHAN')
    );
});

it('rejects publishing a graph without a start step', function () {
    $token = adminTokenForWorkflowApi();
    $workflowId = createWorkflowDraft($token, 'fluxo-sem-start');
    $firstStepId = createStep($token, $workflowId, 'first_step', false);
    $secondStepId = createStep($token, $workflowId, 'second_step', false, 2);
    createTransition($token, $workflowId, $firstStepId, $secondStepId);

    $response = $this->withToken($token)->postJson("/api/v1/workflows/{$workflowId}/publish");

    $response->assertUnprocessable();
    expect(collect($response->json('errors.graph'))->pluck('code'))->toContain('START_STEP_COUNT_INVALID');
});

it('rejects publishing a graph with invalid condition syntax', function () {
    $token = adminTokenForWorkflowApi();
    $workflowId = createWorkflowDraft($token, 'fluxo-condicao-invalida');

    $this->withToken($token)->postJson("/api/v1/workflows/{$workflowId}/form-fields", [
        'key' => 'amount',
        'label' => 'Valor',
        'type' => 'number',
        'required' => true,
        'options' => null,
        'order' => 1,
    ])->assertCreated();

    $startStepId = createStep($token, $workflowId, 'start_approval', true);
    $endStepId = createStep($token, $workflowId, 'terminal_step', false, 2);
    createTransition($token, $workflowId, $startStepId, $endStepId, 'amount >');

    $response = $this->withToken($token)->postJson("/api/v1/workflows/{$workflowId}/publish");

    $response->assertUnprocessable();
    expect(collect($response->json('errors.graph'))->pluck('code'))->toContain('CONDITION_SYNTAX_INVALID');
});

it('creates a new draft version from a published workflow without changing the published version', function () {
    $token = adminTokenForWorkflowApi();
    $workflowId = createWorkflowDraft($token, 'fluxo-versionado');
    $startStepId = createStep($token, $workflowId, 'start_approval', true);
    $endStepId = createStep($token, $workflowId, 'terminal_step', false, 2);
    createTransition($token, $workflowId, $startStepId, $endStepId);

    $this->withToken($token)->postJson("/api/v1/workflows/{$workflowId}/publish")->assertOk();

    $draft = $this->withToken($token)->postJson("/api/v1/workflows/{$workflowId}/draft")
        ->assertCreated()
        ->assertJsonPath('data.status', 'draft')
        ->assertJsonPath('data.version', 2)
        ->json('data');

    expect($draft['steps'])->toHaveCount(2)
        ->and($draft['transitions'])->toHaveCount(1)
        ->and(WorkflowDefinition::find($workflowId)->status->value)->toBe('published');
});
