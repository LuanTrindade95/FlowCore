export type WorkflowDefinitionStatus = 'draft' | 'published' | 'archived';
export type WorkflowStepType = 'approval' | 'task' | 'condition' | 'automation' | 'notification';
export type TransitionEvent = 'approved' | 'rejected' | 'completed' | 'failed' | 'timeout';
export type ApprovalMode = 'any' | 'all' | 'quorum';
export type AssigneeType = 'user' | 'role' | 'department' | 'requester_manager';
export type FormFieldType = 'text' | 'number' | 'select' | 'date' | 'textarea' | 'bool';

export interface WorkflowDefinition {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  version: number;
  status: WorkflowDefinitionStatus;
  category: string | null;
  steps: WorkflowStep[];
  transitions: WorkflowTransition[];
  form_fields: FormField[];
  created_at: string;
  updated_at: string;
}

export interface WorkflowStep {
  id: number;
  workflow_definition_id: number;
  key: string;
  name: string;
  type: WorkflowStepType;
  order: number;
  config: Record<string, unknown>;
  sla_hours: number | null;
  is_start: boolean;
  approvers: StepApprover[];
}

export interface StepApprover {
  id: number;
  workflow_step_id: number;
  assignee_type: AssigneeType;
  assignee_ref: string;
  approval_mode: ApprovalMode;
  quorum_n: number | null;
}

export interface WorkflowTransition {
  id: number;
  workflow_definition_id: number;
  from_step_id: number;
  to_step_id: number;
  on_event: TransitionEvent;
  condition_expression: string | null;
}

export interface FormField {
  id: number;
  workflow_definition_id: number;
  key: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  options: string[] | null;
  order: number;
}

export interface WorkflowDefinitionPayload {
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
}

export interface WorkflowStepPayload {
  key: string;
  name: string;
  type: WorkflowStepType;
  order: number;
  config: Record<string, unknown>;
  sla_hours: number | null;
  is_start: boolean;
}

export interface StepApproverPayload {
  assignee_type: AssigneeType;
  assignee_ref: string;
  approval_mode: ApprovalMode;
  quorum_n: number | null;
}

export interface WorkflowTransitionPayload {
  from_step_id: number;
  to_step_id: number;
  on_event: TransitionEvent;
  condition_expression: string | null;
}

export interface FormFieldPayload {
  key: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  options: string[] | null;
  order: number;
}

export interface GraphValidationError {
  code: string;
  message: string;
  meta?: {
    step_id?: number;
    transition_id?: number;
    start_steps?: number;
    error?: string;
  };
}

export interface PaginatedResource<T> {
  data: T[];
  links?: unknown;
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface Resource<T> {
  data: T;
}
