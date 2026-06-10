import { Directive, HostBinding } from '@angular/core';

@Directive({
  selector: 'input[appInput], textarea[appInput], select[appInput]',
  standalone: true,
})
export class FormControlDirective {
  @HostBinding('class')
  readonly classes =
    'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition';
}
