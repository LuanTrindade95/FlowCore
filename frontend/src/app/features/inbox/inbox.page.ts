import { DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideCheck, LucideMessageSquare, LucideRefreshCw, LucideUserRoundCog, LucideX } from '@lucide/angular';
import { finalize, forkJoin, Observable } from 'rxjs';

import { ToastService } from '../../core/feedback/toast.service';
import { RuntimeRealtimeService } from '../../core/realtime/runtime-realtime.service';
import { ButtonDirective, CardComponent, EmptyStateComponent, FormControlDirective, ModalComponent, StatusPillComponent } from '../../shared/ui';
import { RuntimeApiService } from '../runtime/data/runtime-api.service';
import { InstanceStep, UserSummary } from '../runtime/data/runtime.types';
import { quorumProgress } from '../runtime/runtime.presenter';

type InboxAction = 'approve' | 'reject' | 'comment' | 'reassign';

@Component({
  selector: 'app-inbox-page',
  standalone: true,
  imports: [
    ButtonDirective,
    CardComponent,
    DatePipe,
    EmptyStateComponent,
    FormControlDirective,
    LucideCheck,
    LucideMessageSquare,
    LucideRefreshCw,
    LucideUserRoundCog,
    LucideX,
    ModalComponent,
    ReactiveFormsModule,
    RouterLink,
    StatusPillComponent,
  ],
  template: `
    <section class="space-y-6">
      <div class="flex items-end justify-between gap-3">
        <div>
          <p class="text-sm font-semibold uppercase tracking-[0.14em] text-blue-600">Inbox</p>
          <h1 class="mt-2 text-2xl font-semibold text-slate-950">Pendencias de decisao</h1>
          <p class="mt-2 text-sm text-slate-600">Acoes aparecem somente quando permitidas para o usuario e estado atual.</p>
        </div>
        <button appButton variant="secondary" type="button" (click)="load()">
          <svg lucideRefreshCw class="h-4 w-4"></svg>
          Atualizar
        </button>
      </div>

      @if (steps().length === 0) {
        <app-empty-state title="Inbox em dia" description="Nenhuma etapa aguarda sua decisao neste momento." />
      } @else {
        <div class="grid gap-4 xl:grid-cols-2">
          @for (step of steps(); track step.id) {
            <app-card [title]="step.step.name" [eyebrow]="step.instance?.definition?.name || 'Workflow'">
              <div class="flex flex-wrap items-center gap-2">
                <app-status-pill [label]="step.status === 'escalated' ? 'Escalada' : 'Pendente'" [tone]="step.status === 'escalated' ? 'danger' : 'warning'" />
                <span class="text-xs font-semibold text-slate-500">{{ progress(step) }}</span>
              </div>

              <dl class="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div><dt class="text-slate-500">Solicitante</dt><dd class="mt-1 font-medium text-slate-950">{{ step.instance?.requester?.name }}</dd></div>
                <div><dt class="text-slate-500">SLA</dt><dd class="mt-1 font-medium text-slate-950">{{ step.due_at ? (step.due_at | date: 'short') : 'Sem prazo' }}</dd></div>
              </dl>

              <div class="mt-5 flex flex-wrap gap-2">
                <a appButton variant="secondary" [routerLink]="['/requests', step.workflow_instance_id]">Ver solicitacao</a>
                @if (step.actions.decide) {
                  <button appButton type="button" (click)="openAction(step, 'approve')"><svg lucideCheck class="h-4 w-4"></svg>Aprovar</button>
                  <button appButton variant="danger" type="button" (click)="openAction(step, 'reject')"><svg lucideX class="h-4 w-4"></svg>Rejeitar</button>
                }
                @if (step.actions.comment) {
                  <button appButton variant="ghost" type="button" (click)="openAction(step, 'comment')"><svg lucideMessageSquare class="h-4 w-4"></svg>Comentar</button>
                }
                @if (step.actions.reassign) {
                  <button appButton variant="ghost" type="button" (click)="openAction(step, 'reassign')"><svg lucideUserRoundCog class="h-4 w-4"></svg>Reatribuir</button>
                }
              </div>
            </app-card>
          }
        </div>
      }

      <app-modal [open]="activeStep() !== null" [title]="modalTitle()" (closed)="closeAction()">
        <form class="space-y-4" [formGroup]="actionForm" (ngSubmit)="submitAction()">
          @if (actionMode() === 'reassign') {
            <label class="space-y-1.5">
              <span class="text-xs font-semibold text-slate-600">Novo responsavel</span>
              <select appInput formControlName="assignedTo">
                <option value="">Selecione</option>
                @for (assignee of assignees(); track assignee.id) {
                  <option [value]="assignee.id">{{ assignee.name }} · {{ assignee.email }}</option>
                }
              </select>
            </label>
          } @else {
            <label class="space-y-1.5">
              <span class="text-xs font-semibold text-slate-600">Comentario {{ actionMode() === 'reject' || actionMode() === 'comment' ? '(obrigatorio)' : '(opcional)' }}</span>
              <textarea appInput formControlName="comment" rows="4"></textarea>
            </label>
          }
          <div class="flex justify-end gap-2">
            <button appButton variant="ghost" type="button" (click)="closeAction()">Cancelar</button>
            <button appButton type="submit" [disabled]="!canSubmit() || saving()">Confirmar</button>
          </div>
        </form>
      </app-modal>
    </section>
  `,
})
export class InboxPageComponent {
  private readonly api = inject(RuntimeApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly realtime = inject(RuntimeRealtimeService);
  private readonly toast = inject(ToastService);

  protected readonly steps = signal<InstanceStep[]>([]);
  protected readonly assignees = signal<UserSummary[]>([]);
  protected readonly activeStep = signal<InstanceStep | null>(null);
  protected readonly actionMode = signal<InboxAction | null>(null);
  protected readonly saving = signal(false);
  protected readonly actionForm = new FormGroup({
    comment: new FormControl('', { nonNullable: true }),
    assignedTo: new FormControl('', { nonNullable: true }),
  });
  protected readonly modalTitle = computed(() => {
    const labels: Record<InboxAction, string> = {
      approve: 'Aprovar etapa',
      reject: 'Rejeitar etapa',
      comment: 'Adicionar comentario',
      reassign: 'Reatribuir pendencia',
    };
    const mode = this.actionMode();
    return mode ? labels[mode] : '';
  });

  constructor() {
    this.load();
    this.realtime.runtimeUpdates().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.load(),
    });
  }

  protected load(): void {
    forkJoin({ inbox: this.api.listInbox(), assignees: this.api.listAssignees() }).subscribe({
      next: ({ inbox, assignees }) => {
        this.steps.set(inbox);
        this.assignees.set(assignees);
      },
      error: () => this.toast.danger('Nao foi possivel carregar a inbox.'),
    });
  }

  protected progress(step: InstanceStep): string {
    return quorumProgress(step);
  }

  protected openAction(step: InstanceStep, mode: InboxAction): void {
    this.activeStep.set(step);
    this.actionMode.set(mode);
    this.actionForm.reset({ comment: '', assignedTo: '' });
  }

  protected closeAction(): void {
    this.activeStep.set(null);
    this.actionMode.set(null);
  }

  protected canSubmit(): boolean {
    const mode = this.actionMode();
    const value = this.actionForm.getRawValue();

    if (mode === 'reject' || mode === 'comment') return value.comment.trim().length > 0;
    if (mode === 'reassign') return Number(value.assignedTo) > 0;
    return mode === 'approve';
  }

  protected submitAction(): void {
    const step = this.activeStep();
    const mode = this.actionMode();

    if (!step || !mode || !this.canSubmit()) return;

    const value = this.actionForm.getRawValue();
    this.saving.set(true);
    let request: Observable<unknown>;

    if (mode === 'approve' || mode === 'reject') {
      request = this.api.decide(step.workflow_instance_id, step.id, mode, value.comment.trim() || null);
    } else if (mode === 'comment') {
      request = this.api.comment(step.workflow_instance_id, step.id, value.comment.trim());
    } else {
      request = this.api.reassign(step.workflow_instance_id, step.id, Number(value.assignedTo));
    }

    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.toast.success('Acao registrada.');
        this.closeAction();
        this.load();
      },
      error: () => this.toast.danger('Nao foi possivel registrar a acao.'),
    });
  }
}
