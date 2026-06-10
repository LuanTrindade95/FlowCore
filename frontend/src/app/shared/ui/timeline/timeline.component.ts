import { Component, Input } from '@angular/core';

export interface TimelineItem {
  title: string;
  description: string;
  timestamp: string;
}

@Component({
  selector: 'app-timeline',
  standalone: true,
  template: `
    <ol class="space-y-4">
      @for (item of items; track item.title + item.timestamp) {
        <li class="relative pl-7">
          <span class="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-[var(--color-process-blue)] ring-4 ring-blue-50"></span>
          <p class="text-sm font-semibold text-slate-950">{{ item.title }}</p>
          <p class="mt-1 text-sm text-slate-600">{{ item.description }}</p>
          <time class="mt-1 block text-xs text-slate-400">{{ item.timestamp }}</time>
        </li>
      }
    </ol>
  `,
})
export class TimelineComponent {
  @Input({ required: true }) items: TimelineItem[] = [];
}
