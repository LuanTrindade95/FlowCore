import { Component } from '@angular/core';

import { CardComponent, EmptyStateComponent, StatusPillComponent } from '../../shared/ui';

@Component({
  selector: 'app-requests-foundation-page',
  standalone: true,
  imports: [CardComponent, EmptyStateComponent, StatusPillComponent],
  template: `
    <section class="space-y-6">
      <div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p class="text-sm font-semibold uppercase tracking-[0.14em] text-blue-600">Requisições</p>
          <h1 class="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Solicitações e histórico</h1>
        </div>
        <app-status-pill label="Runtime na Fase 4C" tone="info" />
      </div>

      <app-card title="Base do módulo">
        <app-empty-state
          title="Lista preparada para filtros e detalhe"
          description="O shell já garante autenticação e tratamento de erros; listagem, filtros por URL e detalhe da solicitação entram na Fase 4C."
        />
      </app-card>
    </section>
  `,
})
export class RequestsFoundationPageComponent {}
