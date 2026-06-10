import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  template: `
    <section class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      @if (eyebrow || title) {
        <header class="mb-4">
          @if (eyebrow) {
            <p class="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">{{ eyebrow }}</p>
          }
          @if (title) {
            <h2 class="mt-1 text-base font-semibold text-slate-950">{{ title }}</h2>
          }
        </header>
      }
      <ng-content />
    </section>
  `,
})
export class CardComponent {
  @Input() eyebrow = '';
  @Input() title = '';
}
