import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { ToastService } from '../feedback/toast.service';
import { AuthService } from './auth.service';

export const permissionGuard: CanActivateFn = (route) => {
  const requiredPermissions = route.data['permissions'];

  if (!isStringArray(requiredPermissions) || requiredPermissions.length === 0) {
    return true;
  }

  const auth = inject(AuthService);

  if (auth.hasAnyPermission(requiredPermissions)) {
    return true;
  }

  inject(ToastService).warning('Seu usuário não possui permissão para acessar esta área.');

  return inject(Router).createUrlTree(['/dashboard']);
};

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}
