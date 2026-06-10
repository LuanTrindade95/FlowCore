import { InstanceStep, WorkflowAction } from './data/runtime.types';
import {
  quorumProgress,
  requestFiltersFromQuery,
  requestFiltersToQuery,
  workflowActionsToTimeline,
} from './runtime.presenter';

describe('runtime presenter', () => {
  it('round-trips request filters through URL query state', () => {
    const filters = requestFiltersFromQuery({
      status: 'running',
      workflow: '12',
      mine: '1',
      from: '2026-06-01',
      to: '2026-06-10',
    });

    expect(filters).toEqual({
      status: 'running',
      workflow_definition_id: 12,
      mine: true,
      from: '2026-06-01',
      to: '2026-06-10',
    });
    expect(requestFiltersToQuery(filters)).toEqual({
      status: 'running',
      workflow: '12',
      mine: '1',
      from: '2026-06-01',
      to: '2026-06-10',
    });
  });

  it('renders quorum progress from backend counters', () => {
    const step = {
      approval_mode: 'quorum',
      decisions_count: 1,
      decisions_needed: 3,
    } as InstanceStep;

    expect(quorumProgress(step)).toBe('1 de 3 decisoes');
  });

  it('orders timeline actions chronologically with actor and step context', () => {
    const actions = [
      {
        action: 'approved',
        created_at: '2026-06-10T15:00:00.000Z',
        actor: { id: 2, name: 'Aprovador', email: 'approver@demo.com' },
        step: { name: 'Financeiro' },
        payload: {},
      },
      {
        action: 'submitted',
        created_at: '2026-06-10T14:00:00.000Z',
        actor: { id: 1, name: 'Solicitante', email: 'requester@demo.com' },
        step: null,
        payload: {},
      },
    ] as WorkflowAction[];

    const timeline = workflowActionsToTimeline(actions);

    expect(timeline[0].title).toBe('Solicitacao enviada');
    expect(timeline[1].description).toContain('Aprovador em Financeiro');
  });
});
