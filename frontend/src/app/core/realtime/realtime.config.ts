import { inject, InjectionToken } from '@angular/core';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

import { FLOWCORE_API_BASE_URL } from '../api/api-base-url';

export const DEFAULT_FLOWCORE_REALTIME_APP_KEY = 'flowcore-local-key';
export const DEFAULT_FLOWCORE_REALTIME_HOST = 'localhost';
export const DEFAULT_FLOWCORE_REALTIME_PORT = 8080;

export interface RealtimeConfig {
  appKey: string;
  authEndpoint: string;
  wsHost: string;
  wsPort: number;
  forceTls: boolean;
}

export const FLOWCORE_REALTIME_CONFIG = new InjectionToken<RealtimeConfig>('FLOWCORE_REALTIME_CONFIG', {
  factory: () => {
    const apiBaseUrl = inject(FLOWCORE_API_BASE_URL);

    return {
      appKey: DEFAULT_FLOWCORE_REALTIME_APP_KEY,
      authEndpoint: apiBaseUrl.replace('/api/v1', '/api/broadcasting/auth'),
      wsHost: DEFAULT_FLOWCORE_REALTIME_HOST,
      wsPort: DEFAULT_FLOWCORE_REALTIME_PORT,
      forceTls: false,
    };
  },
});

export type RealtimeEcho = Echo<'reverb'>;

export const FLOWCORE_ECHO_FACTORY = new InjectionToken<(config: RealtimeConfig, token: string) => RealtimeEcho>(
  'FLOWCORE_ECHO_FACTORY',
  {
    factory: () => (config, token) => {
      (globalThis as { Pusher?: typeof Pusher }).Pusher = Pusher;

      return new Echo({
        broadcaster: 'reverb',
        key: config.appKey,
        wsHost: config.wsHost,
        wsPort: config.wsPort,
        wssPort: config.wsPort,
        forceTLS: config.forceTls,
        enabledTransports: config.forceTls ? ['wss'] : ['ws'],
        authEndpoint: config.authEndpoint,
        auth: {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      });
    },
  },
);
