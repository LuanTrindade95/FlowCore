import { Component, inject } from '@angular/core';

import { LoadingService } from '../../../core/http/loading.service';

@Component({
  selector: 'app-loading-bar',
  standalone: true,
  template: `
    @if (loading.isLoading()) {
      <div class="fixed left-0 top-0 z-50 h-1 w-full bg-blue-100">
        <div class="h-full w-2/3 animate-[flowcore-loading_1s_ease-in-out_infinite] bg-[var(--color-process-blue)]"></div>
      </div>
    }
  `,
})
export class LoadingBarComponent {
  protected readonly loading = inject(LoadingService);
}
