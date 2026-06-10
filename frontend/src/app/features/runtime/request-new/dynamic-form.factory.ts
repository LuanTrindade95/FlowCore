import { AbstractControl, FormControl, FormRecord, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

import { FormField } from '../../workflows/data/workflow-definition.types';

export type DynamicFieldValue = string | number | boolean | null;
export type DynamicRequestForm = FormRecord<FormControl<DynamicFieldValue>>;

export function createDynamicRequestForm(fields: FormField[]): DynamicRequestForm {
  const form = new FormRecord<FormControl<DynamicFieldValue>>({});

  for (const field of [...fields].sort((first, second) => first.order - second.order)) {
    const validators: ValidatorFn[] = field.required ? [Validators.required] : [];

    if (field.type === 'number') {
      validators.push(numericValidator);
    }

    if (field.type === 'select' && field.options) {
      validators.push(Validators.pattern(new RegExp(`^(${field.options.map(escapeRegExp).join('|')})$`)));
    }

    const initialValue: DynamicFieldValue = field.type === 'bool' ? false : null;
    form.addControl(field.key, new FormControl<DynamicFieldValue>(initialValue, { validators }));
  }

  return form;
}

export function serializeDynamicRequestForm(form: DynamicRequestForm): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(form.getRawValue()).filter(([, value]) => value !== null && value !== ''),
  );
}

export function extractValidationErrors(body: unknown): Record<string, string[]> {
  if (!body || typeof body !== 'object' || !('errors' in body)) {
    return {};
  }

  const errors = body.errors;

  if (!errors || typeof errors !== 'object') {
    return {};
  }

  return Object.fromEntries(
    Object.entries(errors).filter((entry): entry is [string, string[]] =>
      Array.isArray(entry[1]) && entry[1].every((message) => typeof message === 'string'),
    ),
  );
}

function numericValidator(control: AbstractControl<DynamicFieldValue>): ValidationErrors | null {
  if (control.value === null || control.value === '') {
    return null;
  }

  return typeof control.value === 'number' && Number.isFinite(control.value) ? null : { number: true };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
