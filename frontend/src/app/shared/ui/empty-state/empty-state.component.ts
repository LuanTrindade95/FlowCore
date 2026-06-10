import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <p class="text-sm font-semibold text-slate-900">{{ title }}</p>
      <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">{{ description }}</p>
      <div class="mt-5">
        <ng-content />
      </div>
    </div>
  `,
})
export class EmptyStateComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) description!: string;
}
