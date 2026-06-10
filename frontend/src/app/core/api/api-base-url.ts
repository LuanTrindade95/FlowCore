import { InjectionToken } from '@angular/core';

export const FLOWCORE_API_BASE_URL = new InjectionToken<string>('FLOWCORE_API_BASE_URL', {
  factory: () => 'http://localhost:8000/api/v1',
});
