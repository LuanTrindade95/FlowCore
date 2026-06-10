import { Component, inject } from '@angular/core';

import { ToastKind, ToastService } from '../../../core/feedback/toast.service';

const toastClasses: Record<ToastKind, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  danger: 'border-red-200 bg-red-50 text-red-800',
  info: 'border-blue-200 bg-blue-50 text-blue-800',
};

@Component({
  selector: 'app-toast-outlet',
  standalone: true,
  template: `
    <div class="fixed left-4 top-20 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3 lg:bottom-4 lg:top-auto">
      @for (toast of toastService.toasts(); track toast.id) {
        <section class="rounded-lg border px-4 py-3 text-sm shadow-sm" [class]="toastClasses[toast.kind]">
          <div class="flex items-start justify-between gap-3">
            <p>{{ toast.message }}</p>
            <button type="button" class="font-semibold" (click)="toastService.dismiss(toast.id)">Ok</button>
          </div>
        </section>
      }
    </div>
  `,
})
export class ToastOutletComponent {
  protected readonly toastService = inject(ToastService);
  protected readonly toastClasses = toastClasses;
}
