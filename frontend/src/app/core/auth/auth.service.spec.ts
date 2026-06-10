import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { FLOWCORE_API_BASE_URL } from '../api/api-base-url';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: FLOWCORE_API_BASE_URL, useValue: '/api/v1' },
      ],
    });

    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('stores the bearer token and user after a successful login', () => {
    service.login({ email: 'admin@demo.com', password: 'password' }).subscribe();

    const request = http.expectOne('/api/v1/auth/login');
    expect(request.request.method).toBe('POST');
    request.flush({
      message: 'Login realizado com sucesso.',
      token_type: 'Bearer',
      access_token: 'plain-token',
      user: {
        id: 1,
        name: 'Admin Demo',
        email: 'admin@demo.com',
        roles: ['admin'],
        permissions: ['workflows.manage'],
      },
    });

    expect(service.isAuthenticated()).toBe(true);
    expect(service.token()).toBe('plain-token');
    expect(service.user()?.email).toBe('admin@demo.com');
  });

  it('keeps the session anonymous when login fails', () => {
    service.login({ email: 'admin@demo.com', password: 'wrong' }).subscribe({
      error: () => undefined,
    });

    http.expectOne('/api/v1/auth/login').flush(
      { message: 'As credenciais informadas são inválidas.', code: 'VALIDATION_ERROR' },
      { status: 401, statusText: 'Unauthorized' },
    );

    expect(service.isAuthenticated()).toBe(false);
    expect(service.error()).toBe('E-mail ou senha inválidos.');
  });
});
