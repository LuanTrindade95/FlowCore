import { WorkflowActionType } from '../../features/runtime/data/runtime.types';

export interface RuntimeUpdateEvent {
  workflow_instance_id: number;
  instance_step_id: number | null;
  action: WorkflowActionType;
  occurred_at: string;
}
