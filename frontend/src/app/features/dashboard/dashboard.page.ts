import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ToastService } from '../../core/feedback/toast.service';
import { RuntimeRealtimeService } from '../../core/realtime/runtime-realtime.service';
import { CardComponent, DataTableComponent } from '../../shared/ui';
import { RuntimeApiService } from '../runtime/data/runtime-api.service';
import { DashboardMetrics } from '../runtime/data/runtime.types';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CardComponent, DataTableComponent],
  template: `
    <section class="space-y-6">
      <div>
        <p class="text-sm font-semibold uppercase tracking-[0.14em] text-blue-600">Dashboard</p>
        <h1 class="mt-2 text-2xl font-semibold text-slate-950">Saude operacional dos processos</h1>
        <p class="mt-2 text-sm text-slate-600">Indicadores calculados apenas sobre solicitacoes visiveis para seu perfil.</p>
      </div>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <app-card eyebrow="Pendencias" [title]="String(metrics()?.pending ?? 0)"><p class="text-sm text-slate-600">Etapas abertas aguardando tratamento.</p></app-card>
        <app-card eyebrow="Atrasadas" [title]="String(metrics()?.overdue ?? 0)"><p class="text-sm text-slate-600">Etapas abertas com SLA vencido.</p></app-card>
        <app-card eyebrow="Em andamento" [title]="String(metrics()?.active ?? 0)"><p class="text-sm text-slate-600">Instancias atualmente em execucao.</p></app-card>
        <app-card eyebrow="Throughput 30 dias" [title]="(metrics()?.throughput_percent ?? 0) + '%'"><p class="text-sm text-slate-600">Percentual iniciado e finalizado no periodo.</p></app-card>
      </div>

      <app-card title="Volume por workflow" eyebrow="Portifolio operacional">
        <app-data-table [columns]="columns" [rows]="rows()" />
      </app-card>
    </section>
  `,
})
export class DashboardPageComponent {
  private readonly api = inject(RuntimeApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly realtime = inject(RuntimeRealtimeService);
  private readonly toast = inject(ToastService);

  protected readonly String = String;
  protected readonly metrics = signal<DashboardMetrics | null>(null);
  protected readonly columns = [
    { key: 'name', label: 'Workflow' },
    { key: 'total', label: 'Solicitacoes' },
  ];

  constructor() {
    this.load();
    this.realtime.runtimeUpdates().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.load(),
    });
  }

  private load(): void {
    this.api.dashboard().subscribe({
      next: (metrics) => this.metrics.set(metrics),
      error: () => this.toast.danger('Nao foi possivel carregar os indicadores.'),
    });
  }

  protected rows(): { name: string; total: number }[] {
    return this.metrics()?.workflow_breakdown.map((item) => ({ name: item.name, total: item.total })) ?? [];
  }
}
