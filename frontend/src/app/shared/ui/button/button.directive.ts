import { Directive, HostBinding, Input } from '@angular/core';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const baseClasses =
  'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-60';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-[var(--color-process-blue)] text-white shadow-sm hover:bg-blue-700 focus:ring-blue-500',
  secondary: 'border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 focus:ring-blue-500',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-300',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
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
