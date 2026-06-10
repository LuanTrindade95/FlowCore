import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LucideArrowLeft, LucideArrowDown, LucideArrowUp, LucidePlus, LucideSave } from '@lucide/angular';
import { finalize, forkJoin, of } from 'rxjs';

import { ToastService } from '../../../core/feedback/toast.service';
import { ButtonDirective, CardComponent, FormControlDirective, StatusPillComponent } from '../../../shared/ui';
import { WorkflowDefinitionApiService } from '../data/workflow-definition-api.service';
import { FormField, FormFieldType, WorkflowDefinition } from '../data/workflow-definition.types';
import { moveField, parseSelectOptions, toFormFieldPayload } from './workflow-form.presenter';

@Component({
  selector: 'app-workflow-form-builder-page',
  standalone: true,
  imports: [
    ButtonDirective,
    CardComponent,
    FormControlDirective,
    LucideArrowDown,
    LucideArrowLeft,
    LucideArrowUp,
    LucidePlus,
    LucideSave,
    ReactiveFormsModule,
    RouterLink,
    StatusPillComponent,
  ],
  template: `
    <section class="space-y-6">
      <div class="flex flex-col justify-between gap-3 xl:flex-row xl:items-end">
        <div>
          <a class="inline-flex items-center gap-2 text-sm font-semibold text-blue-700" routerLink="/admin/workflows">
            <svg lucideArrowLeft class="h-4 w-4"></svg>
            Voltar para workflows
          </a>
          <h1 class="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
            Form builder · {{ workflow()?.name || 'Workflow' }}
          </h1>
          <p class="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Configure os campos usados pelas regras condicionais e pela abertura de solicitacoes.
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          @if (workflow(); as currentWorkflow) {
            <app-status-pill [label]="currentWorkflow.status === 'draft' ? 'Rascunho' : 'Publicado'" [tone]="currentWorkflow.status === 'draft' ? 'warning' : 'success'" />
            <a appButton variant="secondary" [routerLink]="['/admin/workflows', currentWorkflow.id, 'builder']">Builder visual</a>
          }
        </div>
      </div>

      <div class="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <app-card title="Campo" eyebrow="Schema">
          <form class="space-y-4" [formGroup]="fieldForm" (ngSubmit)="saveField()">
            <div class="grid gap-3 sm:grid-cols-2">
              <label class="space-y-1.5">
                <span class="text-xs font-semibold text-slate-600">Label</span>
                <input appInput formControlName="label" />
              </label>
              <label class="space-y-1.5">
                <span class="text-xs font-semibold text-slate-600">Chave</span>
                <input appInput formControlName="key" placeholder="amount" />
              </label>
            </div>
            <label class="space-y-1.5">
              <span class="text-xs font-semibold text-slate-600">Tipo</span>
              <select appInput formControlName="type">
                @for (type of fieldTypes; track type) {
                  <option [value]="type">{{ fieldTypeLabel(type) }}</option>
                }
              </select>
            </label>
            <label class="space-y-1.5">
              <span class="text-xs font-semibold text-slate-600">Opcoes para select</span>
              <textarea appInput formControlName="options" rows="4" placeholder="Baixo&#10;Medio&#10;Alto"></textarea>
            </label>
            <label class="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input formControlName="required" type="checkbox" />
              Obrigatorio
            </label>
            <button appButton type="submit" [disabled]="!canEdit() || fieldForm.invalid || saving()">
              <svg lucideSave class="h-4 w-4"></svg>
              Salvar campo
            </button>
          </form>
        </app-card>

        <div class="space-y-6">
          <app-card title="Ordem dos campos" eyebrow="Persistencia">
            <div class="space-y-2">
              @for (field of fields(); track field.id; let index = $index) {
                <div class="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <button class="min-w-0 flex-1 text-left" type="button" (click)="selectField(field)">
                    <p class="truncate text-sm font-semibold text-slate-950">{{ field.label }}</p>
                    <p class="text-xs text-slate-500">{{ field.key }} · {{ fieldTypeLabel(field.type) }}</p>
                  </button>
                  <div class="flex gap-1">
                    <button class="rounded-lg border border-slate-200 bg-white p-2 text-slate-600" type="button" (click)="move(index, index - 1)" [disabled]="index === 0 || !canEdit()">
                      <svg lucideArrowUp class="h-4 w-4"></svg>
                    </button>
                    <button class="rounded-lg border border-slate-200 bg-white p-2 text-slate-600" type="button" (click)="move(index, index + 1)" [disabled]="index === fields().length - 1 || !canEdit()">
                      <svg lucideArrowDown class="h-4 w-4"></svg>
                    </button>
                  </div>
                </div>
              } @empty {
                <div class="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <p class="text-sm font-semibold text-slate-900">Nenhum campo configurado</p>
                  <p class="mt-2 text-sm text-slate-600">Adicione campos para liberar validacao de condicoes no publish.</p>
                </div>
              }
            </div>

            <button class="mt-4" appButton variant="secondary" type="button" (click)="prepareNewField()" [disabled]="!canEdit()">
              <svg lucidePlus class="h-4 w-4"></svg>
              Novo campo
            </button>
          </app-card>

          <app-card title="Preview" eyebrow="Solicitacao">
            <div class="grid gap-4 md:grid-cols-2">
              @for (field of fields(); track field.id) {
                <div class="space-y-1.5">
                  <span class="text-xs font-semibold text-slate-600">
                    {{ field.label }} @if (field.required) { <span class="text-red-600">*</span> }
                  </span>
                  @switch (field.type) {
                    @case ('textarea') {
                      <textarea appInput rows="3" [placeholder]="field.key"></textarea>
                    }
                    @case ('select') {
                      <select appInput>
                        @for (option of field.options ?? []; track option) {
                          <option>{{ option }}</option>
                        }
                      </select>
                    }
                    @case ('bool') {
                      <div class="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700">
                        <input type="checkbox" /> Sim
                      </div>
                    }
                    @default {
                      <input appInput [type]="field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'" [placeholder]="field.key" />
                    }
                  }
                </div>
              }
            </div>
          </app-card>
        </div>
      </div>
    </section>
  `,
})
export class WorkflowFormBuilderPageComponent {
  private readonly api = inject(WorkflowDefinitionApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly workflowId = Number(this.route.snapshot.paramMap.get('id'));

  protected readonly fieldTypes: FormFieldType[] = ['text', 'number', 'select', 'date', 'textarea', 'bool'];
  protected readonly workflow = signal<WorkflowDefinition | null>(null);
  protected readonly selectedFieldId = signal<number | null>(null);
  protected readonly saving = signal(false);
  protected readonly fields = computed(() => [...(this.workflow()?.form_fields ?? [])].sort((a, b) => a.order - b.order));

  protected readonly fieldForm = new FormGroup({
    key: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^[A-Za-z0-9_-]+$/)] }),
    label: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    type: new FormControl<FormFieldType>('text', { nonNullable: true, validators: [Validators.required] }),
    required: new FormControl(false, { nonNullable: true }),
    options: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    this.load();
  }

  protected canEdit(): boolean {
    return this.workflow()?.status === 'draft';
  }

  protected prepareNewField(): void {
    this.selectedFieldId.set(null);
    this.fieldForm.reset({
      key: `field_${this.fields().length + 1}`,
      label: 'Novo campo',
      type: 'text',
      required: false,
      options: '',
    });
  }

  protected selectField(field: FormField): void {
    this.selectedFieldId.set(field.id);
    this.fieldForm.reset({
      key: field.key,
      label: field.label,
      type: field.type,
      required: field.required,
      options: field.options?.join('\n') ?? '',
    });
  }

  protected saveField(): void {
    const currentWorkflow = this.workflow();

    if (!currentWorkflow || this.fieldForm.invalid) {
      this.fieldForm.markAllAsTouched();
      return;
    }

    const value = this.fieldForm.getRawValue();
    const selectedFieldId = this.selectedFieldId();
    const existingField = this.fields().find((field) => field.id === selectedFieldId);
    const payload = {
      key: value.key,
      label: value.label,
      type: value.type,
      required: value.required,
      options: value.type === 'select' ? parseSelectOptions(value.options) : null,
      order: existingField?.order ?? this.fields().length,
    };

    this.saving.set(true);
    const request = existingField
      ? this.api.updateFormField(currentWorkflow.id, existingField.id, payload)
      : this.api.createFormField(currentWorkflow.id, payload);

    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.toast.success('Campo salvo.');
        this.load();
      },
      error: () => this.toast.danger('Nao foi possivel salvar o campo.'),
    });
  }

  protected move(fromIndex: number, toIndex: number): void {
    const currentWorkflow = this.workflow();

    if (!currentWorkflow) {
      return;
    }

    const nextFields = moveField(this.fields(), fromIndex, toIndex);

    if (nextFields === this.fields()) {
      return;
    }

    this.workflow.update((workflow) => (workflow ? { ...workflow, form_fields: nextFields } : workflow));
    this.saving.set(true);

    const updates = nextFields.map((field) =>
      this.api.updateFormField(currentWorkflow.id, field.id, toFormFieldPayload(field)),
    );

    forkJoin(updates.length > 0 ? updates : [of(null)])
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => this.toast.success('Ordem dos campos salva.'),
        error: () => {
          this.toast.danger('Nao foi possivel salvar a ordem dos campos.');
          this.load();
        },
      });
  }

  protected fieldTypeLabel(type: FormFieldType): string {
    const labels: Record<FormFieldType, string> = {
      text: 'Texto curto',
      number: 'Numero',
      select: 'Selecao',
      date: 'Data',
      textarea: 'Texto longo',
      bool: 'Sim/Nao',
    };

    return labels[type];
  }

  private load(): void {
    this.api.get(this.workflowId).subscribe({
      next: (workflow) => this.workflow.set(workflow),
      error: () => this.toast.danger('Nao foi possivel carregar o formulario.'),
    });
  }
}
