import { FormField } from '../data/workflow-definition.types';
import { moveField, parseSelectOptions, toFormFieldPayload } from './workflow-form.presenter';

const fields: FormField[] = [
  {
    id: 1,
    workflow_definition_id: 1,
    key: 'amount',
    label: 'Valor',
    type: 'number',
    required: true,
    options: null,
    order: 0,
  },
  {
    id: 2,
    workflow_definition_id: 1,
    key: 'priority',
    label: 'Prioridade',
    type: 'select',
    required: false,
    options: ['Baixa', 'Alta'],
    order: 1,
  },
  {
    id: 3,
    workflow_definition_id: 1,
    key: 'reason',
    label: 'Justificativa',
    type: 'textarea',
    required: true,
    options: null,
    order: 2,
  },
];

describe('workflow form presenter', () => {
  it('reorders fields and produces persisted payload order', () => {
    const reordered = moveField(fields, 2, 0);

    expect(reordered.map((field) => field.key)).toEqual(['reason', 'amount', 'priority']);
    expect(reordered.map((field) => field.order)).toEqual([0, 1, 2]);
    expect(reordered.map(toFormFieldPayload)).toEqual([
      {
        key: 'reason',
        label: 'Justificativa',
        type: 'textarea',
        required: true,
        options: null,
        order: 0,
      },
      {
        key: 'amount',
        label: 'Valor',
        type: 'number',
        required: true,
        options: null,
        order: 1,
      },
      {
        key: 'priority',
        label: 'Prioridade',
        type: 'select',
        required: false,
        options: ['Baixa', 'Alta'],
        order: 2,
      },
    ]);
  });

  it('keeps invalid reorder requests unchanged', () => {
    expect(moveField(fields, -1, 1)).toBe(fields);
    expect(moveField(fields, 0, 5)).toBe(fields);
  });

  it('normalizes select options from lines or commas', () => {
    expect(parseSelectOptions('Baixa\nMedia,Alta')).toEqual(['Baixa', 'Media', 'Alta']);
    expect(parseSelectOptions('   ')).toBeNull();
  });
});
