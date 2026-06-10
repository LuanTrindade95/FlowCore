import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';

import { FLOWCORE_API_BASE_URL } from '../api/api-base-url';
import { AuthService } from './auth.service';
import { permissionGuard } from './permission.guard';

describe('permissionGuard', () => {
  let auth: AuthService;
  let http: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: FLOWCORE_API_BASE_URL, useValue: '/api/v1' },
      ],
    });

    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    http.verify();
  });

  it('allows users with at least one required permission', () => {
    auth.login({ email: 'admin@demo.com', password: 'password' }).subscribe();
    http.expectOne('/api/v1/auth/login').flush({
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

    const result = runGuard(['workflows.manage']);

    expect(result).toBe(true);
  });

  it('blocks users without the required permission', () => {
    const result = runGuard(['workflows.manage']);

    expect(router.serializeUrl(result as UrlTree)).toBe('/dashboard');
  });

  function runGuard(permissions: string[]): boolean | UrlTree {
    const route = {
      data: { permissions },
    } as unknown as ActivatedRouteSnapshot;
    const state = {
      url: '/workflows',
    } as RouterStateSnapshot;

    return TestBed.runInInjectionContext(() => permissionGuard(route, state)) as boolean | UrlTree;
  }
});
