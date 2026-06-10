import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import { ApiErrorResponse } from '../api/api.types';
import { ToastService } from '../feedback/toast.service';

export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      const apiError = error.error as ApiErrorResponse | null;
      const message = apiError?.message ?? 'Não foi possível concluir a operação.';

      if (error.status === 401 && !request.url.includes('/auth/login')) {
        auth.clearSession();
        toast.warning('Sua sessão expirou. Entre novamente.');
        void router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
      } else if (error.status === 403) {
        toast.warning(message);
      } else if (error.status >= 500) {
        toast.danger('Instabilidade no servidor. Tente novamente em alguns instantes.');
      }

      return throwError(() => error);
    }),
  );
};
