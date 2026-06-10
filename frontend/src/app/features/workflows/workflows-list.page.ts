import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideCopyPlus, LucideFilePenLine, LucidePlus, LucideWorkflow } from '@lucide/angular';
import { finalize } from 'rxjs';

import { ToastService } from '../../core/feedback/toast.service';
import { ButtonDirective, CardComponent, EmptyStateComponent, FormControlDirective, StatusPillComponent } from '../../shared/ui';
import { WorkflowDefinitionApiService } from './data/workflow-definition-api.service';
import { WorkflowDefinition } from './data/workflow-definition.types';

@Component({
  selector: 'app-workflows-list-page',
  standalone: true,
  imports: [
    ButtonDirective,
    CardComponent,
    EmptyStateComponent,
    FormControlDirective,
    LucideCopyPlus,
    LucideFilePenLine,
    LucidePlus,
    LucideWorkflow,
    ReactiveFormsModule,
    RouterLink,
    StatusPillComponent,
  ],
  template: `
    <section class="space-y-6">
      <div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p class="text-sm font-semibold uppercase tracking-[0.14em] text-blue-600">Workflows</p>
          <h1 class="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Definicoes de workflow</h1>
          <p class="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Controle versoes, rascunhos e publicacao de fluxos com validacao centralizada no backend.
          </p>
        </div>
        <button appButton type="button" (click)="showCreateForm.set(!showCreateForm())">
          <svg lucidePlus class="h-4 w-4"></svg>
          Novo workflow
        </button>
      </div>

      @if (showCreateForm()) {
        <app-card title="Novo rascunho" eyebrow="Definition">
          <form class="grid gap-4 md:grid-cols-2" [formGroup]="createForm" (ngSubmit)="createWorkflow()">
            <label class="space-y-1.5">
              <span class="text-xs font-semibold text-slate-600">Nome</span>
              <input appInput formControlName="name" placeholder="Aprovacao de compras" />
            </label>
            <label class="space-y-1.5">
              <span class="text-xs font-semibold text-slate-600">Slug</span>
              <input appInput formControlName="slug" placeholder="purchase-approval" />
            </label>
            <label class="space-y-1.5">
              <span class="text-xs font-semibold text-slate-600">Categoria</span>
              <input appInput formControlName="category" placeholder="Financeiro" />
            </label>
            <label class="space-y-1.5 md:col-span-2">
              <span class="text-xs font-semibold text-slate-600">Descricao</span>
              <textarea appInput formControlName="description" rows="3"></textarea>
            </label>
            <div class="flex justify-end gap-2 md:col-span-2">
              <button appButton variant="ghost" type="button" (click)="showCreateForm.set(false)">Cancelar</button>
              <button appButton type="submit" [disabled]="createForm.invalid || saving()">
                Criar rascunho
              </button>
            </div>
          </form>
        </app-card>
      }

      <app-card title="Catalogo operacional" eyebrow="Versionamento">
        @if (loading()) {
          <div class="grid gap-3">
            @for (item of skeletonRows; track item) {
              <div class="h-20 rounded-lg bg-slate-100"></div>
            }
          </div>
        } @else if (workflows().length === 0) {
          <app-empty-state
            title="Nenhum workflow definido"
            description="Crie um rascunho para iniciar o builder visual e publicar a primeira versao."
          />
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full min-w-[760px] border-separate border-spacing-y-2 text-left">
              <thead>
                <tr class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  <th class="px-3 py-2">Workflow</th>
                  <th class="px-3 py-2">Status</th>
                  <th class="px-3 py-2">Versao</th>
                  <th class="px-3 py-2">Categoria</th>
                  <th class="px-3 py-2 text-right">Acoes</th>
                </tr>
              </thead>
              <tbody>
                @for (workflow of workflows(); track workflow.id) {
                  <tr class="rounded-lg bg-slate-50 text-sm">
                    <td class="rounded-l-lg px-3 py-3">
                      <div class="flex items-center gap-3">
                        <div class="grid h-10 w-10 place-items-center rounded-lg bg-blue-50 text-blue-700">
                          <svg lucideWorkflow class="h-4 w-4"></svg>
                        </div>
                        <div>
                          <p class="font-semibold text-slate-950">{{ workflow.name }}</p>
                          <p class="text-xs text-slate-500">{{ workflow.slug }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-3 py-3">
                      <app-status-pill [label]="statusLabel(workflow)" [tone]="statusTone(workflow)" />
                    </td>
                    <td class="px-3 py-3 text-slate-700">v{{ workflow.version }}</td>
                    <td class="px-3 py-3 text-slate-600">{{ workflow.category || 'Sem categoria' }}</td>
                    <td class="rounded-r-lg px-3 py-3">
                      <div class="flex justify-end gap-2">
                        <a appButton variant="secondary" [routerLink]="['/admin/workflows', workflow.id, 'builder']">
                          <svg lucideFilePenLine class="h-4 w-4"></svg>
                          Builder
                        </a>
                        <a appButton variant="secondary" [routerLink]="['/admin/workflows', workflow.id, 'form']">
                          Form
                        </a>
                        @if (workflow.status === 'published') {
                          <button appButton variant="ghost" type="button" (click)="createDraft(workflow)">
                            <svg lucideCopyPlus class="h-4 w-4"></svg>
                            Nova versao
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </app-card>
    </section>
  `,
})
export class WorkflowsListPageComponent {
  private readonly api = inject(WorkflowDefinitionApiService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly showCreateForm = signal(false);
  protected readonly workflows = signal<WorkflowDefinition[]>([]);
  protected readonly skeletonRows = [1, 2, 3];
  protected readonly createForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    slug: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9_-]+$/), Validators.maxLength(255)]],
    category: [''],
    description: [''],
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);

    this.api
      .list()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (workflows) => this.workflows.set(workflows),
        error: () => this.toast.danger('Nao foi possivel carregar os workflows.'),
      });
  }

  protected createWorkflow(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    const value = this.createForm.getRawValue();
    this.saving.set(true);

    this.api
      .create({
        name: value.name,
        slug: value.slug,
        category: value.category || null,
        description: value.description || null,
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (workflow) => {
          this.workflows.update((current) => [workflow, ...current]);
          this.createForm.reset();
          this.showCreateForm.set(false);
          this.toast.success('Rascunho criado.');
        },
        error: () => this.toast.danger('Nao foi possivel criar o workflow.'),
      });
  }

  protected createDraft(workflow: WorkflowDefinition): void {
    this.saving.set(true);

    this.api
      .createDraft(workflow.id)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (draft) => {
          this.workflows.update((current) => [draft, ...current]);
          this.toast.success('Nova versao em rascunho criada.');
        },
        error: () => this.toast.danger('Nao foi possivel criar a nova versao.'),
      });
  }

  protected statusLabel(workflow: WorkflowDefinition): string {
    if (workflow.status === 'draft') {
      return 'Rascunho';
    }

    if (workflow.status === 'published') {
      return 'Publicado';
    }

    return 'Arquivado';
  }

  protected statusTone(workflow: WorkflowDefinition): 'neutral' | 'success' | 'warning' {
    if (workflow.status === 'draft') {
      return 'warning';
    }

    return workflow.status === 'published' ? 'success' : 'neutral';
  }
}
