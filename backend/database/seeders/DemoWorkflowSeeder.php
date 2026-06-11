<?php

namespace Database\Seeders;

use App\Domain\Workflow\Enums\ApprovalMode;
use App\Domain\Workflow\Enums\AssigneeType;
use App\Domain\Workflow\Enums\FormFieldType;
use App\Domain\Workflow\Enums\InstanceStepStatus;
use App\Domain\Workflow\Enums\TransitionEvent;
use App\Domain\Workflow\Enums\WorkflowActionType;
use App\Domain\Workflow\Enums\WorkflowDefinitionStatus;
use App\Domain\Workflow\Enums\WorkflowInstanceStatus;
use App\Domain\Workflow\Enums\WorkflowStepType;
use App\Models\FormField;
use App\Models\InstanceStep;
use App\Models\StepApprover;
use App\Models\User;
use App\Models\WorkflowAction;
use App\Models\WorkflowDefinition;
use App\Models\WorkflowInstance;
use App\Models\WorkflowStep;
use App\Models\WorkflowTransition;
use Illuminate\Database\Seeder;

class DemoWorkflowSeeder extends Seeder
{
    public function run(): void
    {
        $approver = User::role('approver')->where('email', 'approver@demo.com')->firstOrFail();
        $requester = User::role('requester')->where('email', 'requester@demo.com')->firstOrFail();

        $purchase = $this->definition(
            'Aprovacao de Compra',
            'aprovacao-de-compra',
            'Fluxo com etapa adicional de financeiro para compras acima do limite.',
            'Financeiro'
        );
        $this->resetSeededRuntimeExamples($purchase);

        $purchaseManager = $this->step($purchase, 'manager_approval', 'Aprovacao do Gestor', WorkflowStepType::Approval, 1, true, 24);
        $purchaseFinance = $this->step($purchase, 'finance_approval', 'Aprovacao Financeira', WorkflowStepType::Approval, 2, false, 12);
        $purchaseNotification = $this->step($purchase, 'purchase_completed', 'Notificacao de Conclusao', WorkflowStepType::Notification, 3, false);

        $this->syncApprovers($purchaseManager, [
            [AssigneeType::Dynamic, 'requester_manager', ApprovalMode::Any, null],
        ]);
        $this->syncApprovers($purchaseFinance, [
            [AssigneeType::Role, 'approver', ApprovalMode::Quorum, 1],
        ]);

        $this->field($purchase, 'amount', 'Valor da compra', FormFieldType::Number, true, 1);
        $this->field($purchase, 'supplier', 'Fornecedor', FormFieldType::Text, true, 2);
        $this->field($purchase, 'cost_center', 'Centro de custo', FormFieldType::Select, true, 3, [
            'Tecnologia',
            'Operacoes',
            'Financeiro',
        ]);

        $this->syncTransitions($purchase, [
            [$purchaseManager, $purchaseFinance, TransitionEvent::Approved, 'amount > 1000'],
            [$purchaseManager, $purchaseNotification, TransitionEvent::Approved, 'amount <= 1000'],
            [$purchaseFinance, $purchaseNotification, TransitionEvent::Approved, null],
        ]);

        $vacation = $this->definition(
            'Pedido de Ferias',
            'pedido-de-ferias',
            'Fluxo de ferias com aprovacao do gestor e validacao de RH.',
            'RH'
        );
        $this->resetSeededRuntimeExamples($vacation);

        $vacationManager = $this->step($vacation, 'manager_approval', 'Aprovacao do Gestor', WorkflowStepType::Approval, 1, true, 48);
        $vacationHr = $this->step($vacation, 'hr_review', 'Conferencia do RH', WorkflowStepType::Task, 2, false, 24);
        $vacationNotification = $this->step($vacation, 'vacation_completed', 'Notificacao ao Solicitante', WorkflowStepType::Notification, 3, false);

        $this->syncApprovers($vacationManager, [
            [AssigneeType::Dynamic, 'requester_manager', ApprovalMode::All, null],
        ]);
        $this->syncApprovers($vacationHr, [
            [AssigneeType::Role, 'approver', ApprovalMode::Any, null],
        ]);

        $this->field($vacation, 'start_date', 'Data inicial', FormFieldType::Date, true, 1);
        $this->field($vacation, 'end_date', 'Data final', FormFieldType::Date, true, 2);
        $this->field($vacation, 'reason', 'Observacao', FormFieldType::Textarea, false, 3);

        $this->syncTransitions($vacation, [
            [$vacationManager, $vacationHr, TransitionEvent::Approved, null],
            [$vacationHr, $vacationNotification, TransitionEvent::Completed, null],
        ]);

        $this->createRuntimeExamples($purchase, $purchaseManager, $purchaseFinance, $requester, $approver, 5);
        $this->createRuntimeExamples($vacation, $vacationManager, $vacationHr, $requester, $approver, 5);
    }

    private function definition(string $name, string $slug, string $description, string $category): WorkflowDefinition
    {
        return WorkflowDefinition::updateOrCreate(
            ['slug' => $slug, 'version' => 1],
            [
                'name' => $name,
                'description' => $description,
                'status' => WorkflowDefinitionStatus::Published,
                'category' => $category,
            ]
        );
    }

    private function step(
        WorkflowDefinition $definition,
        string $key,
        string $name,
        WorkflowStepType $type,
        int $order,
        bool $isStart,
        ?int $slaHours = null,
    ): WorkflowStep {
        return WorkflowStep::updateOrCreate(
            [
                'workflow_definition_id' => $definition->id,
                'key' => $key,
            ],
            [
                'name' => $name,
                'type' => $type,
                'order' => $order,
                'config' => [],
                'sla_hours' => $slaHours,
                'is_start' => $isStart,
            ]
        );
    }

    /**
     * @param  list<array{0: AssigneeType, 1: string, 2: ApprovalMode, 3: int|null}>  $approvers
     */
    private function syncApprovers(WorkflowStep $step, array $approvers): void
    {
        $step->approvers()->delete();

        foreach ($approvers as [$assigneeType, $assigneeRef, $approvalMode, $quorumN]) {
            StepApprover::create([
                'workflow_step_id' => $step->id,
                'assignee_type' => $assigneeType,
                'assignee_ref' => $assigneeRef,
                'approval_mode' => $approvalMode,
                'quorum_n' => $quorumN,
            ]);
        }
    }

    /**
     * @param  array<int, string>|null  $options
     */
    private function field(
        WorkflowDefinition $definition,
        string $key,
        string $label,
        FormFieldType $type,
        bool $required,
        int $order,
        ?array $options = null,
    ): void {
        FormField::updateOrCreate(
            [
                'workflow_definition_id' => $definition->id,
                'key' => $key,
            ],
            [
                'label' => $label,
                'type' => $type,
                'required' => $required,
                'options' => $options,
                'order' => $order,
            ]
        );
    }

    /**
     * @param  list<array{0: WorkflowStep, 1: WorkflowStep, 2: TransitionEvent, 3: string|null}>  $transitions
     */
    private function syncTransitions(WorkflowDefinition $definition, array $transitions): void
    {
        $definition->transitions()->delete();

        foreach ($transitions as [$from, $to, $event, $condition]) {
            WorkflowTransition::create([
                'workflow_definition_id' => $definition->id,
                'from_step_id' => $from->id,
                'to_step_id' => $to->id,
                'on_event' => $event,
                'condition_expression' => $condition,
            ]);
        }
    }

    private function resetSeededRuntimeExamples(WorkflowDefinition $definition): void
    {
        $seededInstanceIds = WorkflowAction::query()
            ->whereIn('workflow_instance_id', $definition->instances()->pluck('id'))
            ->get()
            ->filter(fn (WorkflowAction $action): bool => ($action->payload['seeded'] ?? false) === true)
            ->pluck('workflow_instance_id')
            ->unique()
            ->values();

        if ($seededInstanceIds->isNotEmpty()) {
            WorkflowInstance::whereKey($seededInstanceIds)->delete();
        }
    }

    private function createRuntimeExamples(
        WorkflowDefinition $definition,
        WorkflowStep $startStep,
        WorkflowStep $nextStep,
        User $requester,
        User $approver,
        int $count,
    ): void {
        $statuses = [
            WorkflowInstanceStatus::Running,
            WorkflowInstanceStatus::Approved,
            WorkflowInstanceStatus::Rejected,
            WorkflowInstanceStatus::Completed,
            WorkflowInstanceStatus::Running,
        ];

        for ($index = 0; $index < $count; $index++) {
            $status = $statuses[$index % count($statuses)];
            $currentStep = $status === WorkflowInstanceStatus::Running
                ? ($index % 2 === 0 ? $startStep : $nextStep)
                : null;

            $instance = WorkflowInstance::create([
                'workflow_definition_id' => $definition->id,
                'definition_version' => $definition->version,
                'requester_id' => $requester->id,
                'status' => $status,
                'current_step_id' => $currentStep?->id,
                'data' => $this->runtimeData($definition, $index),
                'started_at' => now()->subDays($index + 1),
                'finished_at' => $status === WorkflowInstanceStatus::Running ? null : now()->subDays($index),
            ]);

            $instanceStep = InstanceStep::create([
                'workflow_instance_id' => $instance->id,
                'workflow_step_id' => ($currentStep ?? $startStep)->id,
                'status' => $status === WorkflowInstanceStatus::Running
                    ? InstanceStepStatus::InProgress
                    : InstanceStepStatus::Completed,
                'assigned_to' => $status === WorkflowInstanceStatus::Running ? $approver->id : null,
                'approval_mode' => ApprovalMode::Any,
                'decisions_needed' => 1,
                'decisions_count' => $status === WorkflowInstanceStatus::Running ? 0 : 1,
                'due_at' => $status === WorkflowInstanceStatus::Running ? now()->addHours(12) : null,
                'completed_at' => $status === WorkflowInstanceStatus::Running ? null : now()->subDays($index),
            ]);

            WorkflowAction::create([
                'workflow_instance_id' => $instance->id,
                'instance_step_id' => $instanceStep->id,
                'actor_id' => $requester->id,
                'action' => WorkflowActionType::Submitted,
                'payload' => ['seeded' => true],
            ]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function runtimeData(WorkflowDefinition $definition, int $index): array
    {
        if ($definition->slug === 'pedido-de-ferias') {
            return [
                'start_date' => now()->addDays(15 + $index)->toDateString(),
                'end_date' => now()->addDays(20 + $index)->toDateString(),
                'reason' => 'Planejamento anual de descanso',
                'seed_index' => $index,
            ];
        }

        return [
            'amount' => 750 + ($index * 250),
            'supplier' => ['Atlas Cloud', 'Nexa Office', 'Vector Labs', 'Prime Facilities', 'DataBridge'][$index % 5],
            'cost_center' => ['Tecnologia', 'Operacoes', 'Financeiro'][$index % 3],
            'seed_index' => $index,
        ];
    }
}
