import { TimelineItem } from '../../shared/ui/timeline/timeline.component';
import { InstanceStep, RequestFilters, WorkflowAction, WorkflowInstanceStatus } from './data/runtime.types';

export function requestFiltersFromQuery(params: Record<string, string | null>): RequestFilters {
  const status = params['status'];
  const workflowId = Number(params['workflow']);

  return {
    status: isWorkflowStatus(status) ? status : undefined,
    workflow_definition_id: Number.isInteger(workflowId) && workflowId > 0 ? workflowId : undefined,
    mine: params['mine'] === '1' ? true : undefined,
    from: params['from'] || undefined,
    to: params['to'] || undefined,
  };
}

export function requestFiltersToQuery(filters: RequestFilters): Record<string, string | null> {
  return {
    status: filters.status ?? null,
    workflow: filters.workflow_definition_id ? String(filters.workflow_definition_id) : null,
    mine: filters.mine ? '1' : null,
    from: filters.from ?? null,
    to: filters.to ?? null,
  };
}

export function workflowStatusLabel(status: WorkflowInstanceStatus): string {
  const labels: Record<WorkflowInstanceStatus, string> = {
    running: 'Em andamento',
    approved: 'Aprovada',
    rejected: 'Rejeitada',
    cancelled: 'Cancelada',
    completed: 'Concluida',
  };

  return labels[status];
}

export function quorumProgress(step: InstanceStep): string {
  if (step.approval_mode === 'any') {
    return step.decisions_count > 0 ? 'Decisao registrada' : 'Aguardando uma decisao';
  }

  return `${step.decisions_count} de ${step.decisions_needed} decisoes`;
}

export function workflowActionsToTimeline(actions: WorkflowAction[]): TimelineItem[] {
  return [...actions]
    .sort((first, second) => first.created_at.localeCompare(second.created_at))
    .map((action) => ({
      title: actionTitle(action),
      description: actionDescription(action),
      timestamp: new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(new Date(action.created_at)),
    }));
}

function actionTitle(action: WorkflowAction): string {
  const labels: Record<WorkflowAction['action'], string> = {
    submitted: 'Solicitacao enviada',
    approved: 'Etapa aprovada',
    rejected: 'Etapa rejeitada',
    reassigned: 'Pendencia reatribuida',
    commented: 'Comentario adicionado',
    escalated: 'SLA escalado',
    auto_advanced: 'Etapa avancada automaticamente',
    cancelled: 'Solicitacao cancelada',
  };

  return labels[action.action];
}

function actionDescription(action: WorkflowAction): string {
  const actor = action.actor?.name ?? 'Sistema';
  const step = action.step?.name ? ` em ${action.step.name}` : '';
  const comment = typeof action.payload['comment'] === 'string' ? `: ${action.payload['comment']}` : '';

  return `${actor}${step}${comment}`;
}

function isWorkflowStatus(value: string | null): value is WorkflowInstanceStatus {
  return value !== null && ['running', 'approved', 'rejected', 'cancelled', 'completed'].includes(value);
}
