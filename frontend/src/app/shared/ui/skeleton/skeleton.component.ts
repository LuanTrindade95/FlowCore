import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `<div class="animate-pulse rounded-md bg-slate-200" [style.height]="height" [style.width]="width"></div>`,
})
export class SkeletonComponent {
  @Input() height = '1rem';
  @Input() width = '100%';
}
