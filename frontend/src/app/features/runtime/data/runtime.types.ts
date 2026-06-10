import { FormField, WorkflowDefinition, WorkflowStep } from '../../workflows/data/workflow-definition.types';

export type WorkflowInstanceStatus = 'running' | 'approved' | 'rejected' | 'cancelled' | 'completed';
export type InstanceStepStatus = 'pending' | 'in_progress' | 'approved' | 'rejected' | 'skipped' | 'escalated' | 'completed';
export type WorkflowActionType =
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'reassigned'
  | 'commented'
  | 'escalated'
  | 'auto_advanced'
  | 'cancelled';

export interface UserSummary {
  id: number;
  name: string;
  email: string;
}

export interface RuntimeWorkflowDefinition extends WorkflowDefinition {
  form_fields: FormField[];
}

export interface InstanceStepActions {
  decide: boolean;
  reassign: boolean;
  comment: boolean;
}

export interface InstanceStep {
  id: number;
  workflow_instance_id: number;
  workflow_step_id: number;
  status: InstanceStepStatus;
  assigned_to: number | null;
  approval_mode: 'any' | 'all' | 'quorum';
  decisions_needed: number;
  decisions_count: number;
  due_at: string | null;
  completed_at: string | null;
  step: WorkflowStep;
  assignee: UserSummary | null;
  instance?: {
    id: number;
    status: WorkflowInstanceStatus;
    requester: UserSummary;
    definition: WorkflowDefinition;
  };
  actions: InstanceStepActions;
}

export interface WorkflowAction {
  id: number;
  workflow_instance_id: number;
  instance_step_id: number | null;
  actor_id: number | null;
  action: WorkflowActionType;
  payload: Record<string, unknown>;
  created_at: string;
  actor: UserSummary | null;
  step: WorkflowStep | null;
}

export interface WorkflowInstance {
  id: number;
  workflow_definition_id: number;
  definition_version: number;
  requester_id: number;
  status: WorkflowInstanceStatus;
  current_step_id: number | null;
  data: Record<string, unknown>;
  started_at: string;
  finished_at: string | null;
  definition: WorkflowDefinition;
  requester: UserSummary;
  current_step: WorkflowStep | null;
  steps: InstanceStep[];
  actions: WorkflowAction[];
}

export interface RequestFilters {
  status?: WorkflowInstanceStatus;
  workflow_definition_id?: number;
  mine?: boolean;
  from?: string;
  to?: string;
}

export interface DashboardMetrics {
  pending: number;
  overdue: number;
  active: number;
  completed_last_30_days: number;
  throughput_percent: number;
  workflow_breakdown: {
    workflow_definition_id: number;
    name: string;
    total: number;
  }[];
}
