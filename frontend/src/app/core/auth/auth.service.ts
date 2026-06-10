import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';

import { FLOWCORE_API_BASE_URL } from '../api/api-base-url';
import { LoginRequest, LoginResponse, UserProfile } from '../api/api.types';

type AuthStatus = 'anonymous' | 'authenticated' | 'loading';

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  status: AuthStatus;
  error: string | null;
}

interface UserResourceResponse {
  data: UserProfile;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(FLOWCORE_API_BASE_URL);
  private readonly state = signal<AuthState>({
    token: null,
    user: null,
    status: 'anonymous',
    error: null,
  });

  readonly user = computed(() => this.state().user);
  readonly token = computed(() => this.state().token);
  readonly status = computed(() => this.state().status);
  readonly error = computed(() => this.state().error);
  readonly isAuthenticated = computed(() => this.state().status === 'authenticated' && this.state().token !== null);

  login(credentials: LoginRequest): Observable<UserProfile> {
    this.state.update((current) => ({ ...current, status: 'loading', error: null }));

    return this.http.post<LoginResponse>(`${this.apiBaseUrl}/auth/login`, credentials).pipe(
      tap((response) => {
        this.state.set({
          token: response.access_token,
          user: response.user,
          status: 'authenticated',
          error: null,
        });
      }),
      map((response) => response.user),
      catchError((error: HttpErrorResponse) => {
        const message = this.resolveLoginError(error);
        this.state.set({
          token: null,
          user: null,
          status: 'anonymous',
          error: message,
        });

        return throwError(() => error);
      }),
    );
  }

  loadCurrentUser(): Observable<UserProfile | null> {
    if (!this.token()) {
      return of(null);
    }

    this.state.update((current) => ({ ...current, status: 'loading' }));

    return this.http.get<UserProfile | UserResourceResponse>(`${this.apiBaseUrl}/auth/me`).pipe(
      map((response) => ('data' in response ? response.data : response)),
      tap((user) => {
        this.state.update((current) => ({
          ...current,
          user,
          status: 'authenticated',
          error: null,
        }));
      }),
      catchError((error: HttpErrorResponse) => {
        this.clearSession();

        return throwError(() => error);
      }),
    );
  }

  logout(): Observable<void> {
    if (!this.token()) {
      this.clearSession();

      return of(void 0);
    }

    return this.http.post<void>(`${this.apiBaseUrl}/auth/logout`, {}).pipe(
      tap(() => this.clearSession()),
      catchError((error: HttpErrorResponse) => {
        this.clearSession();

        return throwError(() => error);
      }),
    );
  }

  clearSession(): void {
    this.state.set({
      token: null,
      user: null,
      status: 'anonymous',
      error: null,
    });
  }

  hasAnyPermission(requiredPermissions: string[]): boolean {
    const user = this.user();

    return user !== null && requiredPermissions.some((permission) => user.permissions.includes(permission));
  }

  private resolveLoginError(error: HttpErrorResponse): string {
    if (error.status === 401 || error.status === 422) {
      return 'E-mail ou senha inválidos.';
    }

    return 'Não foi possível entrar agora. Tente novamente em alguns instantes.';
  }
}
