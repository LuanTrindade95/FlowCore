import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideFilter, LucidePlus } from '@lucide/angular';
import { forkJoin } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../core/feedback/toast.service';
import { ButtonDirective, CardComponent, EmptyStateComponent, FormControlDirective, StatusPillComponent } from '../../shared/ui';
import { RuntimeApiService } from '../runtime/data/runtime-api.service';
import { RequestFilters, RuntimeWorkflowDefinition, WorkflowInstance, WorkflowInstanceStatus } from '../runtime/data/runtime.types';
import { requestFiltersFromQuery, requestFiltersToQuery, workflowStatusLabel } from '../runtime/runtime.presenter';

@Component({
  selector: 'app-requests-list-page',
  standalone: true,
  imports: [
    ButtonDirective,
    CardComponent,
    DatePipe,
    EmptyStateComponent,
    FormControlDirective,
    LucideFilter,
    LucidePlus,
    ReactiveFormsModule,
    RouterLink,
    StatusPillComponent,
  ],
  template: `
    <section class="space-y-6">
      <div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p class="text-sm font-semibold uppercase tracking-[0.14em] text-blue-600">Solicitacoes</p>
          <h1 class="mt-2 text-2xl font-semibold text-slate-950">Execucoes de workflow</h1>
          <p class="mt-2 text-sm text-slate-600">Filtros permanecem na URL para compartilhamento e retorno de contexto.</p>
        </div>
        @if (auth.hasAnyPermission(['requests.create'])) {
          <a appButton routerLink="/requests/new">
            <svg lucidePlus class="h-4 w-4"></svg>
            Nova solicitacao
          </a>
        }
      </div>

      <app-card title="Filtros" eyebrow="Consulta operacional">
        <form class="grid gap-3 md:grid-cols-5" [formGroup]="filterForm" (ngSubmit)="applyFilters()">
          <select appInput formControlName="status">
            <option value="">Todos os status</option>
            @for (status of statuses; track status) {
              <option [value]="status">{{ statusLabel(status) }}</option>
            }
          </select>
          <select appInput formControlName="workflow">
            <option value="">Todos os workflows</option>
            @for (workflow of workflows(); track workflow.id) {
              <option [value]="workflow.id">{{ workflow.name }}</option>
            }
          </select>
          <input appInput formControlName="from" type="date" aria-label="Periodo inicial" />
          <input appInput formControlName="to" type="date" aria-label="Periodo final" />
          <div class="flex items-center gap-2">
            <label class="flex items-center gap-2 text-sm text-slate-700">
              <input formControlName="mine" type="checkbox" /> Minhas
            </label>
            <button appButton variant="secondary" type="submit">
              <svg lucideFilter class="h-4 w-4"></svg>
              Filtrar
            </button>
          </div>
        </form>
      </app-card>

      <app-card title="Solicitacoes" eyebrow="Runtime">
        @if (requests().length === 0) {
          <app-empty-state title="Nenhuma solicitacao encontrada" description="Ajuste os filtros ou abra uma nova solicitacao." />
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full min-w-[760px] text-left text-sm">
              <thead class="border-b border-slate-200 text-xs uppercase tracking-[0.1em] text-slate-500">
                <tr>
                  <th class="px-3 py-3">ID</th>
                  <th class="px-3 py-3">Workflow</th>
                  <th class="px-3 py-3">Solicitante</th>
                  <th class="px-3 py-3">Status</th>
                  <th class="px-3 py-3">Etapa atual</th>
                  <th class="px-3 py-3">Inicio</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (request of requests(); track request.id) {
                  <tr>
                    <td class="px-3 py-4"><a class="font-semibold text-blue-700" [routerLink]="['/requests', request.id]">#{{ request.id }}</a></td>
                    <td class="px-3 py-4 font-medium text-slate-950">{{ request.definition.name }}</td>
                    <td class="px-3 py-4 text-slate-600">{{ request.requester.name }}</td>
                    <td class="px-3 py-4"><app-status-pill [label]="statusLabel(request.status)" [tone]="statusTone(request.status)" /></td>
                    <td class="px-3 py-4 text-slate-600">{{ request.current_step?.name || 'Finalizada' }}</td>
                    <td class="px-3 py-4 text-slate-500">{{ request.started_at | date: 'short' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </app-card>
    </section>
  `,
})
export class RequestsListPageComponent {
  protected readonly auth = inject(AuthService);
  private readonly api = inject(RuntimeApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly statuses: WorkflowInstanceStatus[] = ['running', 'approved', 'rejected', 'cancelled', 'completed'];
  protected readonly requests = signal<WorkflowInstance[]>([]);
  protected readonly workflows = signal<RuntimeWorkflowDefinition[]>([]);
  protected readonly filterForm = new FormGroup({
    status: new FormControl('', { nonNullable: true }),
    workflow: new FormControl('', { nonNullable: true }),
    mine: new FormControl(false, { nonNullable: true }),
    from: new FormControl('', { nonNullable: true }),
    to: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    this.route.queryParamMap.subscribe((params) => {
      const filters = requestFiltersFromQuery({
        status: params.get('status'),
        workflow: params.get('workflow'),
        mine: params.get('mine'),
        from: params.get('from'),
        to: params.get('to'),
      });
      this.patchFilters(filters);
      this.load(filters);
    });
  }

  protected applyFilters(): void {
    const value = this.filterForm.getRawValue();
    const filters: RequestFilters = {
      status: (value.status || undefined) as WorkflowInstanceStatus | undefined,
      workflow_definition_id: value.workflow ? Number(value.workflow) : undefined,
      mine: value.mine || undefined,
      from: value.from || undefined,
      to: value.to || undefined,
    };

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: requestFiltersToQuery(filters),
    });
  }

  protected statusLabel(status: WorkflowInstanceStatus): string {
    return workflowStatusLabel(status);
  }

  protected statusTone(status: WorkflowInstanceStatus): 'info' | 'success' | 'danger' | 'neutral' {
    if (status === 'running') return 'info';
    if (status === 'approved' || status === 'completed') return 'success';
    if (status === 'rejected') return 'danger';
    return 'neutral';
  }

  private patchFilters(filters: RequestFilters): void {
    this.filterForm.setValue({
      status: filters.status ?? '',
      workflow: filters.workflow_definition_id ? String(filters.workflow_definition_id) : '',
      mine: filters.mine ?? false,
      from: filters.from ?? '',
      to: filters.to ?? '',
    });
  }

  private load(filters: RequestFilters): void {
    forkJoin({
      requests: this.api.listRequests(filters),
      workflows: this.api.listPublishedWorkflows(),
    }).subscribe({
      next: ({ requests, workflows }) => {
        this.requests.set(requests);
        this.workflows.set(workflows);
      },
      error: () => this.toast.danger('Nao foi possivel carregar as solicitacoes.'),
    });
  }
}
