import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';
import { guestGuard } from './core/auth/guest.guard';
import { permissionGuard } from './core/auth/permission.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login.page').then((m) => m.LoginPageComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./features/shell/app-shell.component').then((m) => m.AppShellComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.page').then((m) => m.DashboardPageComponent),
      },
      {
        path: 'workflows',
        canActivate: [permissionGuard],
        data: { permissions: ['workflows.manage'] },
        loadComponent: () =>
          import('./features/workflows/workflows-foundation.page').then((m) => m.WorkflowsFoundationPageComponent),
      },
      {
        path: 'requests',
        loadComponent: () =>
          import('./features/requests/requests-foundation.page').then((m) => m.RequestsFoundationPageComponent),
      },
      {
        path: 'inbox',
        canActivate: [permissionGuard],
        data: { permissions: ['requests.decide', 'requests.view-all'] },
        loadComponent: () => import('./features/inbox/inbox-foundation.page').then((m) => m.InboxFoundationPageComponent),
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
