import { Component } from '@angular/core';

import { CardComponent, EmptyStateComponent, StatusPillComponent } from '../../shared/ui';

@Component({
  selector: 'app-workflows-foundation-page',
  standalone: true,
  imports: [CardComponent, EmptyStateComponent, StatusPillComponent],
  template: `
    <section class="space-y-6">
      <div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p class="text-sm font-semibold uppercase tracking-[0.14em] text-blue-600">Workflows</p>
          <h1 class="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Administração de definições</h1>
        </div>
        <app-status-pill label="Builder na Fase 4B" tone="info" />
      </div>

      <app-card title="Base do módulo">
        <app-empty-state
          title="Estrutura pronta para o builder visual"
          description="A navegação, permissões e superfície visual estão preparadas; criação e edição de grafos entram na próxima fase."
        />
      </app-card>
    </section>
  `,
})
export class WorkflowsFoundationPageComponent {}
