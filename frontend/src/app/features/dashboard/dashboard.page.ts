import { Component } from '@angular/core';

import { CardComponent, DataTableComponent, TimelineComponent } from '../../shared/ui';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CardComponent, DataTableComponent, TimelineComponent],
  template: `
    <section class="space-y-6">
      <div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p class="text-sm font-semibold uppercase tracking-[0.14em] text-blue-600">Dashboard</p>
          <h1 class="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Saúde operacional dos processos</h1>
        </div>
        <p class="text-sm text-slate-500">Dados demonstrativos até a integração de runtime visual.</p>
      </div>

      <div class="grid gap-4 md:grid-cols-3">
        <app-card eyebrow="Pendências" title="12 itens em aberto">
          <p class="text-sm leading-6 text-slate-600">Volume atual de decisões aguardando aprovadores.</p>
        </app-card>
        <app-card eyebrow="SLA" title="3 em atenção">
          <p class="text-sm leading-6 text-slate-600">Base preparada para destacar atrasos e escalonamentos.</p>
        </app-card>
        <app-card eyebrow="Throughput" title="86% no prazo">
          <p class="text-sm leading-6 text-slate-600">Indicador executivo para operação de workflows.</p>
        </app-card>
      </div>

      <div class="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <app-card title="Workflows monitorados">
          <app-data-table [columns]="workflowColumns" [rows]="workflowRows" />
        </app-card>
        <app-card title="Linha do tempo">
          <app-timeline [items]="timeline" />
        </app-card>
      </div>
    </section>
  `,
})
export class DashboardPageComponent {
  protected readonly workflowColumns = [
    { key: 'name', label: 'Workflow' },
    { key: 'status', label: 'Status' },
    { key: 'pending', label: 'Pendências' },
  ];

  protected readonly workflowRows = [
    { name: 'Aprovação de Compra', status: 'Publicado', pending: 8 },
    { name: 'Pedido de Férias', status: 'Publicado', pending: 4 },
  ];

  protected readonly timeline = [
    {
      title: 'Fundação frontend inicializada',
      description: 'Shell autenticado, UI kit e contrato HTTP prontos para as próximas fases.',
      timestamp: '10/06/2026 14:00',
    },
    {
      title: 'Engine backend validada',
      description: 'Branch condicional, quorum e concorrência aprovados no backend.',
      timestamp: '10/06/2026 13:30',
    },
  ];
}
