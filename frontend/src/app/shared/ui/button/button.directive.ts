import { Directive, HostBinding, Input } from '@angular/core';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const baseClasses =
  'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition outline-none';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-[var(--color-process-blue)] text-white shadow-sm',
  secondary: 'border border-slate-200 bg-white text-slate-800',
  ghost: 'text-slate-600',
  danger: 'bg-red-600 text-white',
};

@Directive({
  selector: 'button[appButton], a[appButton]',
  standalone: true,
})
export class ButtonDirective {
  @Input() variant: ButtonVariant = 'primary';

  @HostBinding('class')
  get classes(): string {
    return `${baseClasses} ${variantClasses[this.variant]}`;
  }
}
