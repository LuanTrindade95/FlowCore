import {
  emptyGraphHighlights,
  mapGraphValidationErrors,
  serializeGraph,
  buildCanvasConnections,
  buildCanvasNodes,
} from './workflow-graph.presenter';
import { WorkflowStep, WorkflowTransition } from '../data/workflow-definition.types';

const steps: WorkflowStep[] = [
  {
    id: 10,
    workflow_definition_id: 1,
    key: 'start',
    name: 'Inicio',
    type: 'approval',
    order: 0,
    config: {},
    sla_hours: 24,
    is_start: true,
    approvers: [
      {
        id: 100,
        workflow_step_id: 10,
        assignee_type: 'role',
        assignee_ref: 'finance',
        approval_mode: 'quorum',
        quorum_n: 2,
      },
    ],
  },
  {
    id: 11,
    workflow_definition_id: 1,
    key: 'finish',
    name: 'Finalizar',
    type: 'task',
    order: 1,
    config: {},
    sla_hours: null,
    is_start: false,
    approvers: [],
  },
];

const transitions: WorkflowTransition[] = [
  {
    id: 20,
    workflow_definition_id: 1,
    from_step_id: 10,
    to_step_id: 11,
    on_event: 'approved',
    condition_expression: 'amount > 1000',
  },
];

describe('workflow graph presenter', () => {
  it('serializes canvas state into backend API payloads', () => {
    const payload = serializeGraph(steps, transitions, new Map());

    expect(payload.steps).toEqual([
      {
        key: 'start',
        name: 'Inicio',
        type: 'approval',
        order: 0,
        config: {},
        sla_hours: 24,
        is_start: true,
      },
      {
        key: 'finish',
        name: 'Finalizar',
        type: 'task',
        order: 1,
        config: {},
        sla_hours: null,
        is_start: false,
      },
    ]);
    expect(payload.transitions).toEqual([
      {
        from_step_id: 10,
        to_step_id: 11,
        on_event: 'approved',
        condition_expression: 'amount > 1000',
      },
    ]);
    expect(payload.approvers).toEqual([
      {
        stepId: 10,
        payload: {
          assignee_type: 'role',
          assignee_ref: 'finance',
          approval_mode: 'quorum',
          quorum_n: 2,
        },
      },
    ]);
  });

  it('maps publication validation errors to highlighted nodes and edges', () => {
    const highlights = mapGraphValidationErrors([
      {
        code: 'STEP_ORPHAN',
        message: 'Etapa orfa.',
        meta: { step_id: 11 },
      },
      {
        code: 'CONDITION_SYNTAX_INVALID',
        message: 'Condicao invalida.',
        meta: { transition_id: 20 },
      },
      {
        code: 'START_STEP_COUNT_INVALID',
        message: 'Inicio invalido.',
      },
    ]);

    const nodes = buildCanvasNodes(steps, highlights);
    const connections = buildCanvasConnections(transitions, highlights);

    expect(nodes.find((node) => node.id === 11)?.hasError).toBe(true);
    expect(connections.find((connection) => connection.id === 20)?.hasError).toBe(true);
    expect(highlights.globalMessages).toEqual(['Inicio invalido.']);
  });

  it('renders a neutral graph when there are no backend errors', () => {
    const nodes = buildCanvasNodes(steps, emptyGraphHighlights());
    const connections = buildCanvasConnections(transitions, emptyGraphHighlights());

    expect(nodes.every((node) => !node.hasError)).toBe(true);
    expect(connections.every((connection) => !connection.hasError)).toBe(true);
  });
});
