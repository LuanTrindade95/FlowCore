import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { FLOWCORE_API_BASE_URL } from '../../../core/api/api-base-url';
import { PaginatedResource, Resource } from '../../workflows/data/workflow-definition.types';
import {
  DashboardMetrics,
  InstanceStep,
  RequestFilters,
  RuntimeWorkflowDefinition,
  UserSummary,
  WorkflowAction,
  WorkflowInstance,
} from './runtime.types';

@Injectable({ providedIn: 'root' })
export class RuntimeApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(FLOWCORE_API_BASE_URL);

  listPublishedWorkflows(): Observable<RuntimeWorkflowDefinition[]> {
    return this.http
      .get<Resource<RuntimeWorkflowDefinition[]>>(`${this.apiBaseUrl}/runtime/workflows`)
      .pipe(map((response) => response.data));
  }

  startRequest(workflowDefinitionId: number, data: Record<string, unknown>): Observable<WorkflowInstance> {
    return this.http
      .post<Resource<WorkflowInstance> | WorkflowInstance>(`${this.apiBaseUrl}/requests`, {
        workflow_definition_id: workflowDefinitionId,
        data,
      })
      .pipe(map(unwrapWorkflowInstance));
  }

  listRequests(filters: RequestFilters): Observable<WorkflowInstance[]> {
    let params = new HttpParams();

    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== false && value !== '') {
        params = params.set(key, String(value));
      }
    }

    return this.http
      .get<PaginatedResource<WorkflowInstance>>(`${this.apiBaseUrl}/requests`, { params })
      .pipe(map((response) => response.data));
  }

  getRequest(id: number): Observable<WorkflowInstance> {
    return this.http
      .get<Resource<WorkflowInstance> | WorkflowInstance>(`${this.apiBaseUrl}/requests/${id}`)
      .pipe(map(unwrapWorkflowInstance));
  }

  listInbox(): Observable<InstanceStep[]> {
    return this.http
      .get<PaginatedResource<InstanceStep>>(`${this.apiBaseUrl}/inbox`)
      .pipe(map((response) => response.data));
  }

  decide(
    requestId: number,
    stepId: number,
    decision: 'approve' | 'reject',
    comment: string | null,
  ): Observable<WorkflowInstance> {
    return this.http
      .post<Resource<WorkflowInstance> | WorkflowInstance>(`${this.apiBaseUrl}/requests/${requestId}/steps/${stepId}/decide`, {
        decision,
        comment,
      })
      .pipe(map(unwrapWorkflowInstance));
  }

  reassign(requestId: number, stepId: number, assignedTo: number): Observable<InstanceStep> {
    return this.http
      .post<Resource<InstanceStep>>(`${this.apiBaseUrl}/requests/${requestId}/steps/${stepId}/reassign`, {
        assigned_to: assignedTo,
      })
      .pipe(map((response) => response.data));
  }

  comment(requestId: number, stepId: number, comment: string): Observable<WorkflowAction> {
    return this.http
      .post<Resource<WorkflowAction>>(`${this.apiBaseUrl}/requests/${requestId}/steps/${stepId}/comment`, { comment })
      .pipe(map((response) => response.data));
  }

  listAssignees(): Observable<UserSummary[]> {
    return this.http
      .get<Resource<UserSummary[]>>(`${this.apiBaseUrl}/runtime/assignees`)
      .pipe(map((response) => response.data));
  }

  dashboard(): Observable<DashboardMetrics> {
    return this.http.get<DashboardMetrics>(`${this.apiBaseUrl}/dashboard`);
  }
}

function unwrapWorkflowInstance(response: Resource<WorkflowInstance> | WorkflowInstance): WorkflowInstance {
  return 'id' in response ? response : response.data;
}
