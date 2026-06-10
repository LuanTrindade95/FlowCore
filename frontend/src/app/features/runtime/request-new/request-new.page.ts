import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideArrowLeft, LucideSend } from '@lucide/angular';
import { finalize } from 'rxjs';

import { ToastService } from '../../../core/feedback/toast.service';
import { ButtonDirective, CardComponent, FormControlDirective } from '../../../shared/ui';
import { FormField } from '../../workflows/data/workflow-definition.types';
import { RuntimeApiService } from '../data/runtime-api.service';
import { RuntimeWorkflowDefinition } from '../data/runtime.types';
import {
  createDynamicRequestForm,
  DynamicRequestForm,
  extractValidationErrors,
  serializeDynamicRequestForm,
} from './dynamic-form.factory';

@Component({
  selector: 'app-request-new-page',
  standalone: true,
  imports: [
    ButtonDirective,
    CardComponent,
    FormControlDirective,
    LucideArrowLeft,
    LucideSend,
    ReactiveFormsModule,
    RouterLink,
  ],
  template: `
    <section class="mx-auto max-w-4xl space-y-6">
      <div>
        <a class="inline-flex items-center gap-2 text-sm font-semibold text-blue-700" routerLink="/requests">
          <svg lucideArrowLeft class="h-4 w-4"></svg>
          Voltar para solicitacoes
        </a>
        <h1 class="mt-3 text-2xl font-semibold text-slate-950">Abrir solicitacao</h1>
        <p class="mt-2 text-sm text-slate-600">O formulario e gerado pela versao publicada do workflow.</p>
      </div>

      <app-card title="Escolha o processo" eyebrow="Workflow publicado">
        <label class="space-y-1.5">
          <span class="text-xs font-semibold text-slate-600">Workflow</span>
          <select appInput [formControl]="workflowControl" (change)="selectWorkflow()">
            <option [ngValue]="null">Selecione</option>
            @for (workflow of workflows(); track workflow.id) {
              <option [ngValue]="workflow.id">{{ workflow.name }} · v{{ workflow.version }}</option>
            }
          </select>
        </label>
      </app-card>

      @if (selectedWorkflow(); as workflow) {
        <app-card [title]="workflow.name" [eyebrow]="workflow.category || 'Formulario'">
          @if (workflow.description) {
            <p class="mb-5 text-sm leading-6 text-slate-600">{{ workflow.description }}</p>
          }

          @if (dynamicForm(); as form) {
            <form class="grid gap-5 md:grid-cols-2" [formGroup]="form" (ngSubmit)="submit()">
              @for (field of orderedFields(); track field.id) {
                <div class="space-y-1.5" [class.md:col-span-2]="field.type === 'textarea'">
                  <span class="text-xs font-semibold text-slate-600">
                    {{ field.label }} @if (field.required) { <span class="text-red-600">*</span> }
                  </span>

                  @switch (field.type) {
                    @case ('textarea') {
                      <textarea appInput rows="4" [formControlName]="field.key" [attr.aria-label]="field.label"></textarea>
                    }
                    @case ('select') {
                      <select appInput [formControlName]="field.key" [attr.aria-label]="field.label">
                        <option [ngValue]="null">Selecione</option>
                        @for (option of field.options ?? []; track option) {
                          <option [value]="option">{{ option }}</option>
                        }
                      </select>
                    }
                    @case ('bool') {
                      <span class="flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm">
                        <input type="checkbox" [formControlName]="field.key" [attr.aria-label]="field.label" />
                        Sim
                      </span>
                    }
                    @default {
                      <input
                        appInput
                        [formControlName]="field.key"
                        [attr.aria-label]="field.label"
                        [type]="field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'"
                      />
                    }
                  }

                  @if (fieldError(field)) {
                    <span class="block text-xs text-red-600">{{ fieldError(field) }}</span>
                  }
                </div>
              }

              <div class="flex justify-end md:col-span-2">
                <button appButton type="submit" [disabled]="form.invalid || submitting()">
                  <svg lucideSend class="h-4 w-4"></svg>
                  {{ submitting() ? 'Enviando...' : 'Enviar solicitacao' }}
                </button>
              </div>
            </form>
          }
        </app-card>
      }
    </section>
  `,
})
export class RequestNewPageComponent {
  private readonly api = inject(RuntimeApiService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly workflows = signal<RuntimeWorkflowDefinition[]>([]);
  protected readonly workflowControl = new FormControl<number | null>(null);
  protected readonly selectedWorkflow = signal<RuntimeWorkflowDefinition | null>(null);
  protected readonly dynamicForm = signal<DynamicRequestForm | null>(null);
  protected readonly backendErrors = signal<Record<string, string[]>>({});
  protected readonly submitting = signal(false);
  protected readonly orderedFields = computed(() =>
    [...(this.selectedWorkflow()?.form_fields ?? [])].sort((first, second) => first.order - second.order),
  );

  constructor() {
    this.api.listPublishedWorkflows().subscribe({
      next: (workflows) => this.workflows.set(workflows),
      error: () => this.toast.danger('Nao foi possivel carregar os workflows publicados.'),
    });
  }

  protected selectWorkflow(): void {
    const workflow = this.workflows().find((item) => item.id === this.workflowControl.value) ?? null;
    this.selectedWorkflow.set(workflow);
    this.dynamicForm.set(workflow ? createDynamicRequestForm(workflow.form_fields) : null);
    this.backendErrors.set({});
  }

  protected fieldError(field: FormField): string | null {
    const backendError = this.backendErrors()[field.key]?.[0];

    if (backendError) {
      return backendError;
    }

    const control = this.dynamicForm()?.controls[field.key];

    if (!control || !control.touched || control.valid) {
      return null;
    }

    return field.required ? 'Campo obrigatorio.' : 'Valor invalido.';
  }

  protected submit(): void {
    const workflow = this.selectedWorkflow();
    const form = this.dynamicForm();

    if (!workflow || !form || form.invalid) {
      form?.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.backendErrors.set({});

    this.api
      .startRequest(workflow.id, serializeDynamicRequestForm(form))
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (instance) => {
          this.toast.success('Solicitacao aberta.');
          void this.router.navigate(['/requests', instance.id]);
        },
        error: (error: HttpErrorResponse) => {
          this.backendErrors.set(extractValidationErrors(error.error));
          this.toast.danger('Revise os campos destacados antes de enviar.');
        },
      });
  }
}
