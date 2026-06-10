import { Directive, HostBinding } from '@angular/core';

@Directive({
  selector: 'input[appInput], textarea[appInput], select[appInput]',
  standalone: true,
})
export class FormControlDirective {
  @HostBinding('class')
  readonly classes =
    'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100';
}
