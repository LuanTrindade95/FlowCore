import { FormField } from '../../workflows/data/workflow-definition.types';
import {
  createDynamicRequestForm,
  extractValidationErrors,
  serializeDynamicRequestForm,
} from './dynamic-form.factory';

const fields: FormField[] = [
  {
    id: 1,
    workflow_definition_id: 10,
    key: 'title',
    label: 'Titulo',
    type: 'text',
    required: true,
    options: null,
    order: 0,
  },
  {
    id: 2,
    workflow_definition_id: 10,
    key: 'amount',
    label: 'Valor',
    type: 'number',
    required: true,
    options: null,
    order: 1,
  },
  {
    id: 3,
    workflow_definition_id: 10,
    key: 'priority',
    label: 'Prioridade',
    type: 'select',
    required: true,
    options: ['Baixa', 'Alta'],
    order: 2,
  },
  {
    id: 4,
    workflow_definition_id: 10,
    key: 'urgent',
    label: 'Urgente',
    type: 'bool',
    required: false,
    options: null,
    order: 3,
  },
];

describe('dynamic request form', () => {
  it('builds controls and validation from the published schema', () => {
    const form = createDynamicRequestForm(fields);

    expect(Object.keys(form.controls)).toEqual(['title', 'amount', 'priority', 'urgent']);
    expect(form.invalid).toBe(true);

    form.controls['title'].setValue('Compra de notebook');
    form.controls['amount'].setValue(4500);
    form.controls['priority'].setValue('Alta');

    expect(form.valid).toBe(true);
    expect(serializeDynamicRequestForm(form)).toEqual({
      title: 'Compra de notebook',
      amount: 4500,
      priority: 'Alta',
      urgent: false,
    });
  });

  it('rejects invalid number and select values before submit', () => {
    const form = createDynamicRequestForm(fields);
    form.controls['title'].setValue('Compra');
    form.controls['amount'].setValue('invalido');
    form.controls['priority'].setValue('Critica');

    expect(form.controls['amount'].hasError('number')).toBe(true);
    expect(form.controls['priority'].hasError('pattern')).toBe(true);
    expect(form.invalid).toBe(true);
  });

  it('extracts field errors from a backend 422 payload', () => {
    expect(extractValidationErrors({
      message: 'Os dados fornecidos sao invalidos.',
      errors: { amount: ['O campo deve ser numerico.'] },
    })).toEqual({ amount: ['O campo deve ser numerico.'] });

    expect(extractValidationErrors({ message: 'Falha' })).toEqual({});
  });
});
