import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  LucideBell,
  LucideClipboardList,
  LucideInbox,
  LucideLayoutDashboard,
  LucideLogOut,
  LucideWorkflow,
} from '@lucide/angular';

import { AuthService } from '../../core/auth/auth.service';
import { ButtonDirective, StatusPillComponent } from '../../shared/ui';

interface ShellNavItem {
  label: string;
  route: string;
  permissions?: string[];
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    ButtonDirective,
    LucideBell,
    LucideClipboardList,
    LucideInbox,
    LucideLayoutDashboard,
    LucideLogOut,
    LucideWorkflow,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    StatusPillComponent,
  ],
  template: `
    <main class="min-h-screen bg-[var(--color-surface)] text-[var(--color-graphite)]">
      <aside class="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200 bg-white px-4 py-5 lg:block">
        <div class="flex items-center gap-3 px-2">
          <div class="grid h-10 w-10 place-items-center rounded-lg bg-[var(--color-process-blue)] text-sm font-bold text-white">
            FC
          </div>
          <div>
            <p class="font-display text-lg font-semibold">FlowCore</p>
            <p class="text-xs text-slate-500">Workflow Ops</p>
          </div>
        </div>

        <nav class="mt-8 space-y-1">
          @for (item of visibleNavItems(); track item.route) {
            <a
              class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              routerLinkActive="bg-blue-50 text-blue-700"
              [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }"
              [routerLink]="item.route"
            >
              @switch (item.route) {
                @case ('/dashboard') {
                  <svg lucideLayoutDashboard class="h-4 w-4"></svg>
                }
                @case ('/workflows') {
                  <svg lucideWorkflow class="h-4 w-4"></svg>
                }
                @case ('/requests') {
                  <svg lucideClipboardList class="h-4 w-4"></svg>
                }
                @case ('/inbox') {
                  <svg lucideInbox class="h-4 w-4"></svg>
                }
              }
              <span>{{ item.label }}</span>
            </a>
          }
        </nav>
      </aside>

      <section class="lg:pl-72">
        <header class="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">Console</p>
              <p class="text-sm text-slate-500">Base autenticada para operações de workflow</p>
            </div>

            <div class="flex items-center gap-3">
              <app-status-pill label="12 pendências" tone="warning" />
              <button class="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50" type="button" aria-label="Notificações">
                <svg lucideBell class="h-4 w-4"></svg>
              </button>
              <div class="hidden text-right sm:block">
                <p class="text-sm font-semibold text-slate-900">{{ auth.user()?.name }}</p>
                <p class="text-xs text-slate-500">{{ auth.user()?.email }}</p>
              </div>
              <button appButton variant="ghost" type="button" (click)="logout()">
                <svg lucideLogOut class="h-4 w-4"></svg>
                Sair
              </button>
            </div>
          </div>
        </header>

        <div class="px-4 py-6 sm:px-6">
          <router-outlet />
        </div>
      </section>
    </main>
  `,
})
export class AppShellComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly navItems: ShellNavItem[] = [
    { label: 'Dashboard', route: '/dashboard' },
    { label: 'Workflows', route: '/workflows', permissions: ['workflows.manage'] },
    { label: 'Requisições', route: '/requests' },
    { label: 'Inbox', route: '/inbox', permissions: ['requests.decide', 'requests.view-all'] },
  ];

  visibleNavItems(): ShellNavItem[] {
    return this.navItems.filter((item) => !item.permissions || this.auth.hasAnyPermission(item.permissions));
  }

  logout(): void {
    this.auth.logout().subscribe({
      next: () => void this.router.navigate(['/login']),
      error: () => void this.router.navigate(['/login']),
    });
  }
}
