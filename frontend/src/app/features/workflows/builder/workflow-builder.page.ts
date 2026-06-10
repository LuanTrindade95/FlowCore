import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FFlowModule } from '@foblex/flow';
import { LucideArrowLeft, LucideGitBranch, LucidePlus, LucideRocket, LucideSave } from '@lucide/angular';
import { finalize } from 'rxjs';

import { ToastService } from '../../../core/feedback/toast.service';
import { ButtonDirective, CardComponent, FormControlDirective, StatusPillComponent } from '../../../shared/ui';
import { WorkflowDefinitionApiService } from '../data/workflow-definition-api.service';
import {
  ApprovalMode,
  AssigneeType,
  GraphValidationError,
  StepApproverPayload,
  TransitionEvent,
  WorkflowDefinition,
  WorkflowStepType,
} from '../data/workflow-definition.types';
import {
  buildCanvasConnections,
  buildCanvasNodes,
  CanvasConnection,
  CanvasNode,
  emptyGraphHighlights,
  GraphHighlights,
  mapGraphValidationErrors,
  nodeInputId,
  nodeOutputId,
  serializeGraph,
} from './workflow-graph.presenter';

@Component({
  selector: 'app-workflow-builder-page',
  standalone: true,
  imports: [
    ButtonDirective,
    CardComponent,
    FFlowModule,
    FormControlDirective,
    LucideArrowLeft,
    LucideGitBranch,
    LucidePlus,
    LucideRocket,
    LucideSave,
    ReactiveFormsModule,
    RouterLink,
    StatusPillComponent,
  ],
  styles: [
    `
      :host {
        display: block;
      }

      f-flow {
        display: block;
        height: 620px;
        overflow: hidden;
        border-radius: 8px;
        border: 1px solid #dbeafe;
        background:
          linear-gradient(#eef2ff 1px, transparent 1px),
          linear-gradient(90deg, #eef2ff 1px, transparent 1px),
          #f8fafc;
        background-size: 32px 32px;
      }

      .workflow-node {
        width: 212px;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        background: white;
        box-shadow: 0 16px 35px rgb(15 23 42 / 10%);
      }

      .workflow-node.is-selected {
        border-color: #2563eb;
        box-shadow: 0 0 0 3px rgb(37 99 235 / 16%);
      }

      .workflow-node.has-error {
        border-color: #dc2626;
        box-shadow: 0 0 0 3px rgb(220 38 38 / 14%);
      }
    `,
  ],
  template: `
    <section class="space-y-6">
      <div class="flex flex-col justify-between gap-3 xl:flex-row xl:items-end">
        <div>
          <a class="inline-flex items-center gap-2 text-sm font-semibold text-blue-700" routerLink="/admin/workflows">
            <svg lucideArrowLeft class="h-4 w-4"></svg>
            Voltar para workflows
          </a>
          <h1 class="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
            {{ workflow()?.name || 'Builder de workflow' }}
          </h1>
          <p class="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Modele etapas, aprovadores e transicoes. A validacao final continua sendo executada pela API.
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          @if (workflow(); as currentWorkflow) {
            <app-status-pill [label]="currentWorkflow.status === 'draft' ? 'Rascunho' : 'Publicado'" [tone]="currentWorkflow.status === 'draft' ? 'warning' : 'success'" />
            <a appButton variant="secondary" [routerLink]="['/admin/workflows', currentWorkflow.id, 'form']">Form builder</a>
            @if (currentWorkflow.status === 'draft') {
              <button appButton type="button" (click)="publish()" [disabled]="saving()">
                <svg lucideRocket class="h-4 w-4"></svg>
                Publicar
              </button>
            } @else {
              <button appButton type="button" (click)="createDraft()" [disabled]="saving()">Criar nova versao</button>
            }
          }
        </div>
      </div>

      @if (graphErrors().length > 0) {
        <div class="rounded-lg border border-red-200 bg-red-50 p-4">
          <p class="text-sm font-semibold text-red-800">Publicacao bloqueada pelo backend</p>
          <ul class="mt-2 space-y-1 text-sm text-red-700">
            @for (error of graphErrors(); track error.code + error.message) {
              <li>{{ error.message }} <span class="text-red-500">({{ error.code }})</span></li>
            }
          </ul>
        </div>
      }

      <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <app-card title="Canvas visual" eyebrow="Foblex Flow">
          <div class="mb-4 flex flex-wrap gap-2">
            @for (type of stepTypes; track type) {
              <button appButton variant="secondary" type="button" (click)="prepareNewStep(type)" [disabled]="!canEdit()">
                <svg lucidePlus class="h-4 w-4"></svg>
                {{ stepTypeLabel(type) }}
              </button>
            }
          </div>

          <f-flow fDraggable>
            <f-canvas>
              @for (connection of canvasConnections(); track connection.id) {
                <f-connection
                  [fConnectionId]="'transition-' + connection.id"
                  [fOutputId]="connection.outputId"
                  [fInputId]="connection.inputId"
                ></f-connection>
              }

              @for (node of canvasNodes(); track node.id) {
                <div
                  fNode
                  fDragHandle
                  fNodeInput
                  fNodeOutput
                  fInputConnectableSide="left"
                  fOutputConnectableSide="right"
                  [fNodeId]="'step-' + node.id"
                  [fInputId]="nodeInputId(node.id)"
                  [fOutputId]="nodeOutputId(node.id)"
                  [fNodePosition]="{ x: node.x, y: node.y }"
                  tabindex="0"
                  class="workflow-node cursor-pointer p-4"
                  [class.is-selected]="selectedStepId() === node.id"
                  [class.has-error]="node.hasError"
                  (click)="selectStep(node)"
                  (keydown.enter)="selectStep(node)"
                  (keydown.space)="selectStep(node)"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <p class="text-xs font-semibold uppercase tracking-[0.12em] text-blue-600">{{ stepTypeLabel(node.type) }}</p>
                      <p class="mt-1 text-sm font-semibold text-slate-950">{{ node.name }}</p>
                      <p class="mt-1 text-xs text-slate-500">{{ node.key }}</p>
                    </div>
                    @if (node.isStart) {
                      <span class="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">Inicio</span>
                    }
                  </div>
                </div>
              }
            </f-canvas>
          </f-flow>
        </app-card>

        <div class="space-y-6">
          <app-card title="Configuracao da etapa" eyebrow="Node">
            <form class="space-y-4" [formGroup]="stepForm" (ngSubmit)="saveStep()">
              <div class="grid gap-3 sm:grid-cols-2">
                <label class="space-y-1.5">
                  <span class="text-xs font-semibold text-slate-600">Nome</span>
                  <input appInput formControlName="name" />
                </label>
                <label class="space-y-1.5">
                  <span class="text-xs font-semibold text-slate-600">Chave</span>
                  <input appInput formControlName="key" />
                </label>
              </div>
              <div class="grid gap-3 sm:grid-cols-2">
                <label class="space-y-1.5">
                  <span class="text-xs font-semibold text-slate-600">Tipo</span>
                  <select appInput formControlName="type">
                    @for (type of stepTypes; track type) {
                      <option [value]="type">{{ stepTypeLabel(type) }}</option>
                    }
                  </select>
                </label>
                <label class="space-y-1.5">
                  <span class="text-xs font-semibold text-slate-600">SLA (horas)</span>
                  <input appInput formControlName="sla_hours" type="number" min="1" />
                </label>
              </div>
              <label class="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input formControlName="is_start" type="checkbox" />
                Etapa inicial
              </label>
              <button appButton type="submit" [disabled]="!canEdit() || stepForm.invalid || saving()">
                <svg lucideSave class="h-4 w-4"></svg>
                Salvar etapa
              </button>
            </form>
          </app-card>

          @if (selectedStep()?.type === 'approval') {
            <app-card title="Aprovadores" eyebrow="RBAC">
              <form class="space-y-4" [formGroup]="approverForm" (ngSubmit)="saveApprover()">
                <div class="grid gap-3 sm:grid-cols-2">
                  <label class="space-y-1.5">
                    <span class="text-xs font-semibold text-slate-600">Tipo</span>
                    <select appInput formControlName="assignee_type">
                      @for (type of assigneeTypes; track type) {
                        <option [value]="type">{{ type }}</option>
                      }
                    </select>
                  </label>
                  <label class="space-y-1.5">
                    <span class="text-xs font-semibold text-slate-600">Referencia</span>
                    <input appInput formControlName="assignee_ref" placeholder="finance-manager" />
                  </label>
                </div>
                <div class="grid gap-3 sm:grid-cols-2">
                  <label class="space-y-1.5">
                    <span class="text-xs font-semibold text-slate-600">Modo</span>
                    <select appInput formControlName="approval_mode">
                      @for (mode of approvalModes; track mode) {
                        <option [value]="mode">{{ mode }}</option>
                      }
                    </select>
                  </label>
                  <label class="space-y-1.5">
                    <span class="text-xs font-semibold text-slate-600">Quorum</span>
                    <input appInput formControlName="quorum_n" type="number" min="1" />
                  </label>
                </div>
                <button appButton type="submit" [disabled]="!canEdit() || approverForm.invalid || saving()">Salvar aprovador</button>
              </form>
            </app-card>
          }

          <app-card title="Transicoes" eyebrow="Edges">
            <form class="space-y-4" [formGroup]="transitionForm" (ngSubmit)="saveTransition()">
              <div class="grid gap-3 sm:grid-cols-2">
                <label class="space-y-1.5">
                  <span class="text-xs font-semibold text-slate-600">Origem</span>
                  <select appInput formControlName="from_step_id">
                    <option value="">Selecione</option>
                    @for (step of sortedSteps(); track step.id) {
                      <option [value]="step.id">{{ step.name }}</option>
                    }
                  </select>
                </label>
                <label class="space-y-1.5">
                  <span class="text-xs font-semibold text-slate-600">Destino</span>
                  <select appInput formControlName="to_step_id">
                    <option value="">Selecione</option>
                    @for (step of sortedSteps(); track step.id) {
                      <option [value]="step.id">{{ step.name }}</option>
                    }
                  </select>
                </label>
              </div>
              <label class="space-y-1.5">
                <span class="text-xs font-semibold text-slate-600">Evento</span>
                <select appInput formControlName="on_event">
                  @for (event of transitionEvents; track event) {
                    <option [value]="event">{{ event }}</option>
                  }
                </select>
              </label>
              <label class="space-y-1.5">
                <span class="text-xs font-semibold text-slate-600">Condicao ExpressionLanguage</span>
                <textarea appInput formControlName="condition_expression" rows="3" placeholder="amount > 1000"></textarea>
              </label>
              <button appButton type="submit" [disabled]="!canEdit() || transitionForm.invalid || saving()">
                <svg lucideGitBranch class="h-4 w-4"></svg>
                Salvar transicao
              </button>
            </form>

            <div class="mt-4 space-y-2">
              @for (connection of canvasConnections(); track connection.id) {
                <button
                  class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm"
                  type="button"
                  [class.border-red-300]="connection.hasError"
                  (click)="selectTransition(connection)"
                >
                  {{ stepName(connection.fromStepId) }} -> {{ stepName(connection.toStepId) }} · {{ connection.label }}
                </button>
              }
            </div>
          </app-card>
        </div>
      </div>
    </section>
  `,
})
export class WorkflowBuilderPageComponent {
  private readonly api = inject(WorkflowDefinitionApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly workflowId = Number(this.route.snapshot.paramMap.get('id'));

  protected readonly stepTypes: WorkflowStepType[] = ['approval', 'task', 'condition', 'automation', 'notification'];
  protected readonly transitionEvents: TransitionEvent[] = ['approved', 'rejected', 'completed', 'failed', 'timeout'];
  protected readonly assigneeTypes: AssigneeType[] = ['user', 'role', 'department', 'requester_manager'];
  protected readonly approvalModes: ApprovalMode[] = ['any', 'all', 'quorum'];
  protected readonly workflow = signal<WorkflowDefinition | null>(null);
  protected readonly graphErrors = signal<GraphValidationError[]>([]);
  protected readonly highlights = signal<GraphHighlights>(emptyGraphHighlights());
  protected readonly selectedStepId = signal<number | null>(null);
  protected readonly selectedTransitionId = signal<number | null>(null);
  protected readonly saving = signal(false);

  protected readonly sortedSteps = computed(() => [...(this.workflow()?.steps ?? [])].sort((a, b) => a.order - b.order));
  protected readonly selectedStep = computed(() => {
    const stepId = this.selectedStepId();
    return this.workflow()?.steps.find((step) => step.id === stepId) ?? null;
  });
  protected readonly canvasNodes = computed<CanvasNode[]>(() =>
    buildCanvasNodes(this.workflow()?.steps ?? [], this.highlights()),
  );
  protected readonly canvasConnections = computed<CanvasConnection[]>(() =>
    buildCanvasConnections(this.workflow()?.transitions ?? [], this.highlights()),
  );

  protected readonly stepForm = new FormGroup({
    key: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^[A-Za-z0-9_-]+$/)] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    type: new FormControl<WorkflowStepType>('approval', { nonNullable: true, validators: [Validators.required] }),
    sla_hours: new FormControl<number | null>(null),
    is_start: new FormControl(false, { nonNullable: true }),
  });

  protected readonly approverForm = new FormGroup({
    assignee_type: new FormControl<AssigneeType>('role', { nonNullable: true, validators: [Validators.required] }),
    assignee_ref: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    approval_mode: new FormControl<ApprovalMode>('any', { nonNullable: true, validators: [Validators.required] }),
    quorum_n: new FormControl<number | null>(null),
  });

  protected readonly transitionForm = new FormGroup({
    from_step_id: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    to_step_id: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    on_event: new FormControl<TransitionEvent>('approved', { nonNullable: true, validators: [Validators.required] }),
    condition_expression: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    this.load();
  }

  protected canEdit(): boolean {
    return this.workflow()?.status === 'draft';
  }

  protected nodeInputId(stepId: number): string {
    return nodeInputId(stepId);
  }

  protected nodeOutputId(stepId: number): string {
    return nodeOutputId(stepId);
  }

  protected prepareNewStep(type: WorkflowStepType): void {
    const order = this.sortedSteps().length;
    this.selectedStepId.set(null);
    this.stepForm.reset({
      key: `${type}-${order + 1}`,
      name: this.stepTypeLabel(type),
      type,
      sla_hours: type === 'approval' ? 24 : null,
      is_start: order === 0,
    });
  }

  protected selectStep(node: CanvasNode): void {
    const step = this.workflow()?.steps.find((item) => item.id === node.id);

    if (!step) {
      return;
    }

    this.selectedStepId.set(step.id);
    this.selectedTransitionId.set(null);
    this.stepForm.reset({
      key: step.key,
      name: step.name,
      type: step.type,
      sla_hours: step.sla_hours,
      is_start: step.is_start,
    });

    const approver = step.approvers[0];
    this.approverForm.reset({
      assignee_type: approver?.assignee_type ?? 'role',
      assignee_ref: approver?.assignee_ref ?? '',
      approval_mode: approver?.approval_mode ?? 'any',
      quorum_n: approver?.quorum_n ?? null,
    });
  }

  protected selectTransition(connection: CanvasConnection): void {
    const transition = this.workflow()?.transitions.find((item) => item.id === connection.id);

    if (!transition) {
      return;
    }

    this.selectedTransitionId.set(transition.id);
    this.transitionForm.reset({
      from_step_id: String(transition.from_step_id),
      to_step_id: String(transition.to_step_id),
      on_event: transition.on_event,
      condition_expression: transition.condition_expression ?? '',
    });
  }

  protected saveStep(): void {
    const currentWorkflow = this.workflow();

    if (!currentWorkflow || this.stepForm.invalid) {
      this.stepForm.markAllAsTouched();
      return;
    }

    const value = this.stepForm.getRawValue();
    const selectedStep = this.selectedStep();
    const payload = {
      key: value.key,
      name: value.name,
      type: value.type,
      order: selectedStep?.order ?? this.sortedSteps().length,
      config: {},
      sla_hours: value.sla_hours,
      is_start: value.is_start,
    };

    this.saving.set(true);
    const request = selectedStep
      ? this.api.updateStep(currentWorkflow.id, selectedStep.id, payload)
      : this.api.createStep(currentWorkflow.id, payload);

    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.toast.success('Etapa salva.');
        this.load();
      },
      error: () => this.toast.danger('Nao foi possivel salvar a etapa.'),
    });
  }

  protected saveApprover(): void {
    const currentWorkflow = this.workflow();
    const step = this.selectedStep();

    if (!currentWorkflow || !step || this.approverForm.invalid) {
      this.approverForm.markAllAsTouched();
      return;
    }

    const payload: StepApproverPayload = this.approverForm.getRawValue();
    this.saving.set(true);

    const existingApprover = step.approvers[0];
    const request = existingApprover
      ? this.api.updateApprover(currentWorkflow.id, step.id, existingApprover.id, payload)
      : this.api.createApprover(currentWorkflow.id, step.id, payload);

    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.toast.success('Aprovador salvo.');
        this.load();
      },
      error: () => this.toast.danger('Nao foi possivel salvar o aprovador.'),
    });
  }

  protected saveTransition(): void {
    const currentWorkflow = this.workflow();

    if (!currentWorkflow || this.transitionForm.invalid) {
      this.transitionForm.markAllAsTouched();
      return;
    }

    const value = this.transitionForm.getRawValue();
    const payload = {
      from_step_id: Number(value.from_step_id),
      to_step_id: Number(value.to_step_id),
      on_event: value.on_event,
      condition_expression: value.condition_expression.trim() || null,
    };
    const selectedTransitionId = this.selectedTransitionId();
    this.saving.set(true);

    const request = selectedTransitionId
      ? this.api.updateTransition(currentWorkflow.id, selectedTransitionId, payload)
      : this.api.createTransition(currentWorkflow.id, payload);

    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.toast.success('Transicao salva.');
        this.load();
      },
      error: () => this.toast.danger('Nao foi possivel salvar a transicao.'),
    });
  }

  protected publish(): void {
    const currentWorkflow = this.workflow();

    if (!currentWorkflow) {
      return;
    }

    serializeGraph(currentWorkflow.steps, currentWorkflow.transitions, new Map<number, StepApproverPayload>());
    this.saving.set(true);
    this.graphErrors.set([]);
    this.highlights.set(emptyGraphHighlights());

    this.api
      .publish(currentWorkflow.id)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (workflow) => {
          this.workflow.set(workflow);
          this.toast.success('Workflow publicado.');
        },
        error: (error: HttpErrorResponse) => {
          const graphErrors = this.extractGraphErrors(error);
          this.graphErrors.set(graphErrors);
          this.highlights.set(mapGraphValidationErrors(graphErrors));
          this.toast.danger('A publicacao encontrou erros no grafo.');
        },
      });
  }

  protected createDraft(): void {
    const currentWorkflow = this.workflow();

    if (!currentWorkflow) {
      return;
    }

    this.saving.set(true);
    this.api
      .createDraft(currentWorkflow.id)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (draft) => {
          this.workflow.set(draft);
          this.toast.success('Nova versao criada em rascunho.');
        },
        error: () => this.toast.danger('Nao foi possivel criar a nova versao.'),
      });
  }

  protected stepName(stepId: number): string {
    return this.workflow()?.steps.find((step) => step.id === stepId)?.name ?? `Etapa ${stepId}`;
  }

  protected stepTypeLabel(type: WorkflowStepType): string {
    const labels: Record<WorkflowStepType, string> = {
      approval: 'Aprovacao',
      task: 'Tarefa',
      condition: 'Condicao',
      automation: 'Automacao',
      notification: 'Notificacao',
    };

    return labels[type];
  }

  private load(): void {
    this.api.get(this.workflowId).subscribe({
      next: (workflow) => {
        this.workflow.set(workflow);
        this.graphErrors.set([]);
        this.highlights.set(emptyGraphHighlights());
      },
      error: () => this.toast.danger('Nao foi possivel carregar o workflow.'),
    });
  }

  private extractGraphErrors(error: HttpErrorResponse): GraphValidationError[] {
    const body = error.error as { errors?: { graph?: GraphValidationError[] } } | null;

    if (!Array.isArray(body?.errors?.graph)) {
      return [];
    }

    return body.errors.graph;
  }
}
