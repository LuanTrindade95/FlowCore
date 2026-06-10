import { FormField, FormFieldPayload } from '../data/workflow-definition.types';

export function moveField(fields: FormField[], fromIndex: number, toIndex: number): FormField[] {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= fields.length || toIndex >= fields.length) {
    return fields;
  }

  const next = [...fields];
  const [field] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, field);

  return next.map((item, index) => ({ ...item, order: index }));
}

export function toFormFieldPayload(field: FormField): FormFieldPayload {
  return {
    key: field.key,
    label: field.label,
    type: field.type,
    required: field.required,
    options: field.options,
    order: field.order,
  };
}

export function parseSelectOptions(value: string): string[] | null {
  const options = value
    .split(/\r?\n|,/)
    .map((option) => option.trim())
    .filter((option) => option.length > 0);

  return options.length > 0 ? options : null;
}
