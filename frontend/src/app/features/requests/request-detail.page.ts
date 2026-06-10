import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, KeyValuePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LucideArrowLeft } from '@lucide/angular';

import { ToastService } from '../../core/feedback/toast.service';
import { CardComponent, StatusPillComponent, TimelineComponent } from '../../shared/ui';
import { RuntimeApiService } from '../runtime/data/runtime-api.service';
import { WorkflowInstance, WorkflowInstanceStatus } from '../runtime/data/runtime.types';
import { workflowActionsToTimeline, workflowStatusLabel } from '../runtime/runtime.presenter';

@Component({
  selector: 'app-request-detail-page',
  standalone: true,
  imports: [CardComponent, DatePipe, KeyValuePipe, LucideArrowLeft, RouterLink, StatusPillComponent, TimelineComponent],
  template: `
    <section class="space-y-6">
      <div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <a class="inline-flex items-center gap-2 text-sm font-semibold text-blue-700" routerLink="/requests">
            <svg lucideArrowLeft class="h-4 w-4"></svg>
            Voltar para solicitacoes
          </a>
          <h1 class="mt-3 text-2xl font-semibold text-slate-950">Solicitacao #{{ request()?.id }}</h1>
          <p class="mt-2 text-sm text-slate-600">{{ request()?.definition?.name }} · versao {{ request()?.definition_version }}</p>
        </div>
        @if (request(); as currentRequest) {
          <app-status-pill [label]="statusLabel(currentRequest.status)" [tone]="statusTone(currentRequest.status)" />
        }
      </div>

      @if (request(); as currentRequest) {
        <div class="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <div class="space-y-6">
            <app-card title="Estado atual" eyebrow="Instancia">
              <dl class="grid gap-4 text-sm sm:grid-cols-2">
                <div><dt class="text-slate-500">Solicitante</dt><dd class="mt-1 font-semibold text-slate-950">{{ currentRequest.requester.name }}</dd></div>
                <div><dt class="text-slate-500">Etapa atual</dt><dd class="mt-1 font-semibold text-slate-950">{{ currentRequest.current_step?.name || 'Finalizada' }}</dd></div>
                <div><dt class="text-slate-500">Inicio</dt><dd class="mt-1 text-slate-700">{{ currentRequest.started_at | date: 'short' }}</dd></div>
                <div><dt class="text-slate-500">Conclusao</dt><dd class="mt-1 text-slate-700">{{ currentRequest.finished_at ? (currentRequest.finished_at | date: 'short') : 'Em andamento' }}</dd></div>
              </dl>
            </app-card>

            <app-card title="Dados enviados" eyebrow="Formulario">
              <dl class="space-y-3 text-sm">
                @for (entry of currentRequest.data | keyvalue; track entry.key) {
                  <div class="flex justify-between gap-4 border-b border-slate-100 pb-3">
                    <dt class="font-medium text-slate-600">{{ entry.key }}</dt>
                    <dd class="text-right text-slate-950">{{ entry.value }}</dd>
                  </div>
                }
              </dl>
            </app-card>
          </div>

          <app-card title="Linha do tempo" eyebrow="Auditoria">
            <app-timeline [items]="timeline()" />
          </app-card>
        </div>
      }
    </section>
  `,
})
export class RequestDetailPageComponent {
  private readonly api = inject(RuntimeApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  protected readonly request = signal<WorkflowInstance | null>(null);
  protected readonly timeline = computed(() => workflowActionsToTimeline(this.request()?.actions ?? []));

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getRequest(id).subscribe({
      next: (request) => this.request.set(request),
      error: () => this.toast.danger('Nao foi possivel carregar a solicitacao.'),
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
}
