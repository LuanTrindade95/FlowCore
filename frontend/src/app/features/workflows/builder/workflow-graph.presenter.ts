import {
  GraphValidationError,
  StepApproverPayload,
  WorkflowStep,
  WorkflowStepPayload,
  WorkflowTransition,
  WorkflowTransitionPayload,
} from '../data/workflow-definition.types';

export interface CanvasNode {
  id: number;
  key: string;
  name: string;
  type: WorkflowStep['type'];
  order: number;
  isStart: boolean;
  x: number;
  y: number;
  hasError: boolean;
}

export interface CanvasConnection {
  id: number;
  fromStepId: number;
  toStepId: number;
  outputId: string;
  inputId: string;
  label: string;
  hasError: boolean;
}

export interface GraphSerialization {
  steps: WorkflowStepPayload[];
  transitions: WorkflowTransitionPayload[];
  approvers: { stepId: number; payload: StepApproverPayload }[];
}

export interface GraphHighlights {
  stepIds: ReadonlySet<number>;
  transitionIds: ReadonlySet<number>;
  globalMessages: string[];
}

const NODE_HORIZONTAL_GAP = 260;
const NODE_VERTICAL_GAP = 150;

export function buildCanvasNodes(steps: WorkflowStep[], highlights: GraphHighlights): CanvasNode[] {
  return [...steps]
    .sort((first, second) => first.order - second.order)
    .map((step, index) => ({
      id: step.id,
      key: step.key,
      name: step.name,
      type: step.type,
      order: step.order,
      isStart: step.is_start,
      x: 48 + (index % 3) * NODE_HORIZONTAL_GAP,
      y: 48 + Math.floor(index / 3) * NODE_VERTICAL_GAP,
      hasError: highlights.stepIds.has(step.id),
    }));
}

export function buildCanvasConnections(
  transitions: WorkflowTransition[],
  highlights: GraphHighlights,
): CanvasConnection[] {
  return transitions.map((transition) => ({
    id: transition.id,
    fromStepId: transition.from_step_id,
    toStepId: transition.to_step_id,
    outputId: nodeOutputId(transition.from_step_id),
    inputId: nodeInputId(transition.to_step_id),
    label: transition.condition_expression ? `${transition.on_event} · condicao` : transition.on_event,
    hasError: highlights.transitionIds.has(transition.id),
  }));
}

export function nodeInputId(stepId: number): string {
  return `step-${stepId}-in`;
}

export function nodeOutputId(stepId: number): string {
  return `step-${stepId}-out`;
}

export function serializeGraph(
  steps: WorkflowStep[],
  transitions: WorkflowTransition[],
  approverOverrides: ReadonlyMap<number, StepApproverPayload>,
): GraphSerialization {
  return {
    steps: steps.map((step) => ({
      key: step.key,
      name: step.name,
      type: step.type,
      order: step.order,
      config: step.config,
      sla_hours: step.sla_hours,
      is_start: step.is_start,
    })),
    transitions: transitions.map((transition) => ({
      from_step_id: transition.from_step_id,
      to_step_id: transition.to_step_id,
      on_event: transition.on_event,
      condition_expression: transition.condition_expression,
    })),
    approvers: steps.flatMap((step) => {
      const override = approverOverrides.get(step.id);

      if (override) {
        return [{ stepId: step.id, payload: override }];
      }

      return step.approvers.map((approver) => ({
        stepId: step.id,
        payload: {
          assignee_type: approver.assignee_type,
          assignee_ref: approver.assignee_ref,
          approval_mode: approver.approval_mode,
          quorum_n: approver.quorum_n,
        },
      }));
    }),
  };
}

export function mapGraphValidationErrors(errors: GraphValidationError[]): GraphHighlights {
  const stepIds = new Set<number>();
  const transitionIds = new Set<number>();
  const globalMessages: string[] = [];

  for (const error of errors) {
    if (error.meta?.step_id !== undefined) {
      stepIds.add(error.meta.step_id);
      continue;
    }

    if (error.meta?.transition_id !== undefined) {
      transitionIds.add(error.meta.transition_id);
      continue;
    }

    globalMessages.push(error.message);
  }

  return { stepIds, transitionIds, globalMessages };
}

export function emptyGraphHighlights(): GraphHighlights {
  return {
    stepIds: new Set<number>(),
    transitionIds: new Set<number>(),
    globalMessages: [],
  };
}
