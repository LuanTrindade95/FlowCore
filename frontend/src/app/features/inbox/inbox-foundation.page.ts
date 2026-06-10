import { Component } from '@angular/core';

import { CardComponent, EmptyStateComponent, StatusPillComponent } from '../../shared/ui';

@Component({
  selector: 'app-inbox-foundation-page',
  standalone: true,
  imports: [CardComponent, EmptyStateComponent, StatusPillComponent],
  template: `
    <section class="space-y-6">
      <div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p class="text-sm font-semibold uppercase tracking-[0.14em] text-blue-600">Inbox</p>
          <h1 class="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Pendências de decisão</h1>
        </div>
        <app-status-pill label="Ações na Fase 4C" tone="warning" />
      </div>

      <app-card title="Base do módulo">
        <app-empty-state
          title="Pronto para aprovações e rejeições"
          description="A autorização já bloqueia usuários sem permissão; ações de aprovar, rejeitar, comentar e reatribuir entram junto ao runtime visual."
        />
      </app-card>
    </section>
  `,
})
export class InboxFoundationPageComponent {}
