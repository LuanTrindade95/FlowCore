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
        $approver = User::role('approver')->firstOrFail();
        $requester = User::role('requester')->firstOrFail();

        $purchase = WorkflowDefinition::create([
            'name' => 'Aprovacao de Compra',
            'slug' => 'aprovacao-de-compra',
            'description' => 'Fluxo com etapa adicional de financeiro para compras acima do limite.',
            'version' => 1,
            'status' => WorkflowDefinitionStatus::Published,
            'category' => 'Financeiro',
        ]);

        $purchaseManager = $this->createStep($purchase, 'manager_approval', 'Aprovacao do Gestor', WorkflowStepType::Approval, 1, true, 24);
        $purchaseFinance = $this->createStep($purchase, 'finance_approval', 'Aprovacao Financeira', WorkflowStepType::Approval, 2, false, 12);
        $purchaseNotification = $this->createStep($purchase, 'purchase_completed', 'Notificacao de Conclusao', WorkflowStepType::Notification, 3, false);

        $this->createApprover($purchaseManager, AssigneeType::Dynamic, 'requester_manager', ApprovalMode::Any);
        $this->createApprover($purchaseFinance, AssigneeType::Role, 'approver', ApprovalMode::Quorum, 1);

        $this->createField($purchase, 'amount', 'Valor da compra', FormFieldType::Number, true, 1);
        $this->createField($purchase, 'supplier', 'Fornecedor', FormFieldType::Text, true, 2);
        $this->createField($purchase, 'cost_center', 'Centro de custo', FormFieldType::Select, true, 3, [
            'Tecnologia',
            'Operacoes',
            'Financeiro',
        ]);

        $this->createTransition($purchase, $purchaseManager, $purchaseFinance, TransitionEvent::Approved, 'amount > 1000');
        $this->createTransition($purchase, $purchaseManager, $purchaseNotification, TransitionEvent::Approved, 'amount <= 1000');
        $this->createTransition($purchase, $purchaseFinance, $purchaseNotification, TransitionEvent::Approved);

        $vacation = WorkflowDefinition::create([
            'name' => 'Pedido de Ferias',
            'slug' => 'pedido-de-ferias',
            'description' => 'Fluxo de ferias com aprovacao do gestor e validacao de RH.',
            'version' => 1,
            'status' => WorkflowDefinitionStatus::Published,
            'category' => 'RH',
        ]);

        $vacationManager = $this->createStep($vacation, 'manager_approval', 'Aprovacao do Gestor', WorkflowStepType::Approval, 1, true, 48);
        $vacationHr = $this->createStep($vacation, 'hr_review', 'Conferencia do RH', WorkflowStepType::Task, 2, false, 24);
        $vacationNotification = $this->createStep($vacation, 'vacation_completed', 'Notificacao ao Solicitante', WorkflowStepType::Notification, 3, false);

        $this->createApprover($vacationManager, AssigneeType::Dynamic, 'requester_manager', ApprovalMode::All);
        $this->createApprover($vacationHr, AssigneeType::Role, 'approver', ApprovalMode::Any);

        $this->createField($vacation, 'start_date', 'Data inicial', FormFieldType::Date, true, 1);
        $this->createField($vacation, 'end_date', 'Data final', FormFieldType::Date, true, 2);
        $this->createField($vacation, 'reason', 'Observacao', FormFieldType::Textarea, false, 3);

        $this->createTransition($vacation, $vacationManager, $vacationHr, TransitionEvent::Approved);
        $this->createTransition($vacation, $vacationHr, $vacationNotification, TransitionEvent::Completed);

        $this->createRuntimeExamples($purchase, $purchaseManager, $purchaseFinance, $requester, $approver, 5);
        $this->createRuntimeExamples($vacation, $vacationManager, $vacationHr, $requester, $approver, 5);
    }

    private function createStep(
        WorkflowDefinition $definition,
        string $key,
        string $name,
        WorkflowStepType $type,
        int $order,
        bool $isStart,
        ?int $slaHours = null,
    ): WorkflowStep {
        return WorkflowStep::create([
            'workflow_definition_id' => $definition->id,
            'key' => $key,
            'name' => $name,
            'type' => $type,
            'order' => $order,
            'config' => [],
            'sla_hours' => $slaHours,
            'is_start' => $isStart,
        ]);
    }

    private function createApprover(
        WorkflowStep $step,
        AssigneeType $assigneeType,
        string $assigneeRef,
        ApprovalMode $approvalMode,
        ?int $quorumN = null,
    ): void {
        StepApprover::create([
            'workflow_step_id' => $step->id,
            'assignee_type' => $assigneeType,
            'assignee_ref' => $assigneeRef,
            'approval_mode' => $approvalMode,
            'quorum_n' => $quorumN,
        ]);
    }

    /**
     * @param  array<string, mixed>|null  $options
     */
    private function createField(
        WorkflowDefinition $definition,
        string $key,
        string $label,
        FormFieldType $type,
        bool $required,
        int $order,
        ?array $options = null,
    ): void {
        FormField::create([
            'workflow_definition_id' => $definition->id,
            'key' => $key,
            'label' => $label,
            'type' => $type,
            'required' => $required,
            'options' => $options,
            'order' => $order,
        ]);
    }

    private function createTransition(
        WorkflowDefinition $definition,
        WorkflowStep $from,
        WorkflowStep $to,
        TransitionEvent $event,
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
                'data' => [
                    'amount' => 750 + ($index * 250),
                    'seed_index' => $index,
                ],
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
}
