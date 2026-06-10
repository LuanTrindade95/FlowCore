import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { FLOWCORE_API_BASE_URL } from '../../../core/api/api-base-url';
import {
  FormField,
  FormFieldPayload,
  PaginatedResource,
  Resource,
  StepApprover,
  StepApproverPayload,
  WorkflowDefinition,
  WorkflowDefinitionPayload,
  WorkflowStep,
  WorkflowStepPayload,
  WorkflowTransition,
  WorkflowTransitionPayload,
} from './workflow-definition.types';

@Injectable({ providedIn: 'root' })
export class WorkflowDefinitionApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(FLOWCORE_API_BASE_URL);

  list(): Observable<WorkflowDefinition[]> {
    return this.http
      .get<PaginatedResource<WorkflowDefinition>>(`${this.apiBaseUrl}/workflows`)
      .pipe(map((response) => response.data));
  }

  create(payload: WorkflowDefinitionPayload): Observable<WorkflowDefinition> {
    return this.http
      .post<Resource<WorkflowDefinition>>(`${this.apiBaseUrl}/workflows`, payload)
      .pipe(map((response) => response.data));
  }

  get(id: number): Observable<WorkflowDefinition> {
    return this.http
      .get<Resource<WorkflowDefinition>>(`${this.apiBaseUrl}/workflows/${id}`)
      .pipe(map((response) => response.data));
  }

  update(id: number, payload: WorkflowDefinitionPayload): Observable<WorkflowDefinition> {
    return this.http
      .put<Resource<WorkflowDefinition>>(`${this.apiBaseUrl}/workflows/${id}`, payload)
      .pipe(map((response) => response.data));
  }

  createDraft(id: number): Observable<WorkflowDefinition> {
    return this.http
      .post<Resource<WorkflowDefinition>>(`${this.apiBaseUrl}/workflows/${id}/draft`, {})
      .pipe(map((response) => response.data));
  }

  publish(id: number): Observable<WorkflowDefinition> {
    return this.http
      .post<Resource<WorkflowDefinition>>(`${this.apiBaseUrl}/workflows/${id}/publish`, {})
      .pipe(map((response) => response.data));
  }

  createStep(workflowId: number, payload: WorkflowStepPayload): Observable<WorkflowStep> {
    return this.http
      .post<Resource<WorkflowStep>>(`${this.apiBaseUrl}/workflows/${workflowId}/steps`, payload)
      .pipe(map((response) => response.data));
  }

  updateStep(workflowId: number, stepId: number, payload: WorkflowStepPayload): Observable<WorkflowStep> {
    return this.http
      .put<Resource<WorkflowStep>>(`${this.apiBaseUrl}/workflows/${workflowId}/steps/${stepId}`, payload)
      .pipe(map((response) => response.data));
  }

  createApprover(workflowId: number, stepId: number, payload: StepApproverPayload): Observable<StepApprover> {
    return this.http
      .post<Resource<StepApprover>>(`${this.apiBaseUrl}/workflows/${workflowId}/steps/${stepId}/approvers`, payload)
      .pipe(map((response) => response.data));
  }

  updateApprover(
    workflowId: number,
    stepId: number,
    approverId: number,
    payload: StepApproverPayload,
  ): Observable<StepApprover> {
    return this.http
      .put<Resource<StepApprover>>(
        `${this.apiBaseUrl}/workflows/${workflowId}/steps/${stepId}/approvers/${approverId}`,
        payload,
      )
      .pipe(map((response) => response.data));
  }

  deleteApprover(workflowId: number, stepId: number, approverId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/workflows/${workflowId}/steps/${stepId}/approvers/${approverId}`);
  }

  createTransition(workflowId: number, payload: WorkflowTransitionPayload): Observable<WorkflowTransition> {
    return this.http
      .post<Resource<WorkflowTransition>>(`${this.apiBaseUrl}/workflows/${workflowId}/transitions`, payload)
      .pipe(map((response) => response.data));
  }

  updateTransition(
    workflowId: number,
    transitionId: number,
    payload: WorkflowTransitionPayload,
  ): Observable<WorkflowTransition> {
    return this.http
      .put<Resource<WorkflowTransition>>(`${this.apiBaseUrl}/workflows/${workflowId}/transitions/${transitionId}`, payload)
      .pipe(map((response) => response.data));
  }

  createFormField(workflowId: number, payload: FormFieldPayload): Observable<FormField> {
    return this.http
      .post<Resource<FormField>>(`${this.apiBaseUrl}/workflows/${workflowId}/form-fields`, payload)
      .pipe(map((response) => response.data));
  }

  updateFormField(workflowId: number, fieldId: number, payload: FormFieldPayload): Observable<FormField> {
    return this.http
      .put<Resource<FormField>>(`${this.apiBaseUrl}/workflows/${workflowId}/form-fields/${fieldId}`, payload)
      .pipe(map((response) => response.data));
  }
}
