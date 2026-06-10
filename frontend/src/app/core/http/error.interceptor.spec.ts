import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { ToastService } from '../feedback/toast.service';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  let http: HttpTestingController;
  let client: HttpClient;
  let router: Router;
  let toast: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    http = TestBed.inject(HttpTestingController);
    client = TestBed.inject(HttpClient);
    router = TestBed.inject(Router);
    toast = TestBed.inject(ToastService);
  });

  afterEach(() => {
    http.verify();
  });

  it('redirects to login and shows a toast on 401 responses outside login', () => {
    const navigate = jest.spyOn(router, 'navigate').mockResolvedValue(true);

    client.get('/secure-resource').subscribe({
      error: () => undefined,
    });

    http.expectOne('/secure-resource').flush(
      { message: 'Não autenticado.', code: 'UNAUTHENTICATED' },
      { status: 401, statusText: 'Unauthorized' },
    );

    expect(navigate).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: '/' } });
    expect(toast.toasts()[0]?.message).toBe('Sua sessão expirou. Entre novamente.');
  });
});
