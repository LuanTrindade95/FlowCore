import { InjectionToken } from '@angular/core';

export const DEFAULT_FLOWCORE_API_BASE_URL = 'http://localhost:8000/api/v1';

export const FLOWCORE_API_BASE_URL = new InjectionToken<string>('FLOWCORE_API_BASE_URL', {
  factory: () => DEFAULT_FLOWCORE_API_BASE_URL,
});
