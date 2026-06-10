import { Component, Input } from '@angular/core';

type StatusTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

const toneClasses: Record<StatusTone, string> = {
  neutral: 'bg-slate-100 text-slate-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-700',
  info: 'bg-blue-50 text-blue-700',
};

@Component({
  selector: 'app-status-pill',
  standalone: true,
  template: `
    <span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold" [class]="toneClasses[tone]">
      {{ label }}
    </span>
  `,
})
export class StatusPillComponent {
  @Input({ required: true }) label!: string;
  @Input() tone: StatusTone = 'neutral';

  protected readonly toneClasses = toneClasses;
}
