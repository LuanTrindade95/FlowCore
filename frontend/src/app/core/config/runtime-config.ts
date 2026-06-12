import { Provider } from '@angular/core';

import { DEFAULT_FLOWCORE_API_BASE_URL, FLOWCORE_API_BASE_URL } from '../api/api-base-url';
import {
  DEFAULT_FLOWCORE_REALTIME_APP_KEY,
  DEFAULT_FLOWCORE_REALTIME_HOST,
  DEFAULT_FLOWCORE_REALTIME_PORT,
  FLOWCORE_REALTIME_CONFIG,
  RealtimeConfig,
} from '../realtime/realtime.config';

export interface FlowcoreRuntimeConfig {
  apiBaseUrl: string;
  realtime: {
    appKey: string;
    authEndpoint?: string;
    wsHost: string;
    wsPort: number;
    forceTls: boolean;
  };
}

export const DEFAULT_FLOWCORE_RUNTIME_CONFIG: FlowcoreRuntimeConfig = {
  apiBaseUrl: DEFAULT_FLOWCORE_API_BASE_URL,
  realtime: {
    appKey: DEFAULT_FLOWCORE_REALTIME_APP_KEY,
    wsHost: DEFAULT_FLOWCORE_REALTIME_HOST,
    wsPort: DEFAULT_FLOWCORE_REALTIME_PORT,
    forceTls: false,
  },
};

type PartialRuntimeConfig = Partial<{
  apiBaseUrl: unknown;
  realtime: Partial<{
    appKey: unknown;
    authEndpoint: unknown;
    wsHost: unknown;
    wsPort: unknown;
    forceTls: unknown;
  }>;
}>;

export async function loadFlowcoreRuntimeConfig(
  configUrl = '/config.json',
  runtimeHostname = globalThis.location?.hostname,
): Promise<FlowcoreRuntimeConfig> {
  let response: Response;

  try {
    response = await fetch(configUrl, { cache: 'no-store' });
  } catch (error) {
    return fallbackOrThrow(configUrl, error instanceof Error ? error.message : 'unknown error', runtimeHostname);
  }

  if (!response.ok) {
    return fallbackOrThrow(configUrl, `HTTP ${response.status}`, runtimeHostname);
  }

  try {
    return normalizeRuntimeConfig((await response.json()) as PartialRuntimeConfig);
  } catch (error) {
    return fallbackOrThrow(configUrl, error instanceof Error ? error.message : 'invalid JSON', runtimeHostname);
  }
}

export function provideFlowcoreRuntimeConfig(config: FlowcoreRuntimeConfig): Provider[] {
  const normalized = normalizeRuntimeConfig(config);
  const realtimeConfig: RealtimeConfig = {
    appKey: normalized.realtime.appKey,
    authEndpoint: normalized.realtime.authEndpoint ?? normalized.apiBaseUrl.replace('/api/v1', '/api/broadcasting/auth'),
    wsHost: normalized.realtime.wsHost,
    wsPort: normalized.realtime.wsPort,
    forceTls: normalized.realtime.forceTls,
  };

  return [
    { provide: FLOWCORE_API_BASE_URL, useValue: normalized.apiBaseUrl },
    { provide: FLOWCORE_REALTIME_CONFIG, useValue: realtimeConfig },
  ];
}

export function normalizeRuntimeConfig(config: PartialRuntimeConfig): FlowcoreRuntimeConfig {
  const realtime = config.realtime ?? {};

  return {
    apiBaseUrl: readString(config.apiBaseUrl, DEFAULT_FLOWCORE_RUNTIME_CONFIG.apiBaseUrl, { trimTrailingSlash: true }),
    realtime: {
      appKey: readString(realtime.appKey, DEFAULT_FLOWCORE_RUNTIME_CONFIG.realtime.appKey),
      authEndpoint:
        realtime.authEndpoint === undefined
          ? undefined
          : readString(realtime.authEndpoint, '', { trimTrailingSlash: true }) || undefined,
      wsHost: readString(realtime.wsHost, DEFAULT_FLOWCORE_RUNTIME_CONFIG.realtime.wsHost),
      wsPort: readPort(realtime.wsPort, DEFAULT_FLOWCORE_RUNTIME_CONFIG.realtime.wsPort),
      forceTls: typeof realtime.forceTls === 'boolean' ? realtime.forceTls : DEFAULT_FLOWCORE_RUNTIME_CONFIG.realtime.forceTls,
    },
  };
}

function readString(value: unknown, fallback: string, options: { trimTrailingSlash?: boolean } = {}): string {
  const normalized = typeof value === 'string' && value.trim() ? value.trim() : fallback;

  return options.trimTrailingSlash ? normalized.replace(/\/+$/, '') : normalized;
}

function readPort(value: unknown, fallback: number): number {
  const normalized = typeof value === 'string' ? Number(value) : value;

  return typeof normalized === 'number' && Number.isInteger(normalized) && normalized > 0 ? normalized : fallback;
}

function fallbackOrThrow(configUrl: string, reason: string, runtimeHostname: string | undefined): FlowcoreRuntimeConfig {
  if (isLocalRuntime(runtimeHostname)) {
    return DEFAULT_FLOWCORE_RUNTIME_CONFIG;
  }

  throw new Error(`Could not load FlowCore runtime config from ${configUrl}: ${reason}`);
}

function isLocalRuntime(hostname: string | undefined): boolean {
  return !hostname || ['localhost', '127.0.0.1', '::1'].includes(hostname);
}
