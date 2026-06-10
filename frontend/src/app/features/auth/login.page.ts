import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { ButtonDirective, FormControlDirective, StatusPillComponent } from '../../shared/ui';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ButtonDirective, CommonModule, FormControlDirective, ReactiveFormsModule, StatusPillComponent],
  template: `
    <main class="min-h-screen bg-[var(--color-surface)] text-[var(--color-graphite)]">
      <section class="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <div class="flex flex-col justify-between px-6 py-8 sm:px-10 lg:px-16">
          <header class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="grid h-10 w-10 place-items-center rounded-lg bg-[var(--color-process-blue)] text-sm font-bold text-white">
                FC
              </div>
              <div>
                <p class="font-display text-lg font-semibold">FlowCore</p>
                <p class="text-xs text-slate-500">Processos empresariais</p>
              </div>
            </div>
            <app-status-pill label="MVP interno" tone="info" />
          </header>

          <div class="mx-auto w-full max-w-md py-12">
            <p class="text-sm font-semibold uppercase tracking-[0.14em] text-blue-600">Acesso seguro</p>
            <h1 class="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Entre no painel operacional</h1>
            <p class="mt-3 text-sm leading-6 text-slate-600">
              Use uma conta com permissões para administrar workflows, acompanhar requisições e tratar pendências.
            </p>

            <form class="mt-8 space-y-5" [formGroup]="form" (ngSubmit)="submit()">
              <label class="block">
                <span class="text-sm font-medium text-slate-700">E-mail</span>
                <input
                  appInput
                  class="mt-2"
                  type="email"
                  autocomplete="email"
                  formControlName="email"
                  placeholder="admin@demo.com"
                />
                @if (showEmailError()) {
                  <span class="mt-1 block text-xs text-red-600">Informe um e-mail válido.</span>
                }
              </label>

              <label class="block">
                <span class="text-sm font-medium text-slate-700">Senha</span>
                <input
                  appInput
                  class="mt-2"
                  type="password"
                  autocomplete="current-password"
                  formControlName="password"
                  placeholder="Digite sua senha"
                />
                @if (showPasswordError()) {
                  <span class="mt-1 block text-xs text-red-600">Informe a senha.</span>
                }
              </label>

              @if (auth.error()) {
                <div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {{ auth.error() }}
                </div>
              }

              <button appButton type="submit" class="w-full" [disabled]="form.invalid || submitting()">
                {{ submitting() ? 'Entrando...' : 'Entrar' }}
              </button>
            </form>
          </div>

          <p class="text-xs text-slate-500">Locale pt-BR ativo para datas, moedas e validações de interface.</p>
        </div>

        <aside class="hidden border-l border-slate-200 bg-white p-10 lg:flex lg:flex-col lg:justify-center">
          <div class="rounded-lg border border-slate-200 bg-slate-50 p-6">
            <p class="text-sm font-semibold text-slate-950">Ambiente demonstrativo</p>
            <dl class="mt-5 space-y-4 text-sm">
              <div class="flex items-center justify-between gap-4">
                <dt class="text-slate-500">Admin</dt>
                <dd class="font-medium text-slate-900">admin&#64;demo.com</dd>
              </div>
              <div class="flex items-center justify-between gap-4">
                <dt class="text-slate-500">Aprovador</dt>
                <dd class="font-medium text-slate-900">approver&#64;demo.com</dd>
              </div>
              <div class="flex items-center justify-between gap-4">
                <dt class="text-slate-500">Solicitante</dt>
                <dd class="font-medium text-slate-900">requester&#64;demo.com</dd>
              </div>
            </dl>
          </div>
        </aside>
      </section>
    </main>
  `,
})
export class LoginPageComponent {
  protected readonly auth = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly submitting = signal(false);

  protected readonly form = this.formBuilder.nonNullable.group({
    email: ['admin@demo.com', [Validators.required, Validators.email]],
    password: ['password', [Validators.required]],
  });

  protected readonly showEmailError = computed(() => {
    const control = this.form.controls.email;

    return control.invalid && (control.dirty || control.touched);
  });

  protected readonly showPasswordError = computed(() => {
    const control = this.form.controls.password;

    return control.invalid && (control.dirty || control.touched);
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      return;
    }

    this.submitting.set(true);
    this.auth
      .login(this.form.getRawValue())
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/dashboard';
          void this.router.navigateByUrl(returnUrl);
        },
        error: () => undefined,
      });
  }
}
