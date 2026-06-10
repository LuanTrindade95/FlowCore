import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  template: `
    @if (open) {
      <div class="fixed inset-0 z-40 grid place-items-center bg-slate-950/40 px-4 py-6" role="dialog" aria-modal="true">
        <section class="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h2 class="text-lg font-semibold text-slate-950">{{ title }}</h2>
              @if (description) {
                <p class="mt-1 text-sm text-slate-600">{{ description }}</p>
              }
            </div>
            <button type="button" class="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100" (click)="closed.emit()">
              Fechar
            </button>
          </div>
          <div class="mt-5">
            <ng-content />
          </div>
        </section>
      </div>
    }
  `,
})
export class ModalComponent {
  @Input() open = false;
  @Input() title = '';
  @Input() description = '';
  @Output() readonly closed = new EventEmitter<void>();
}
