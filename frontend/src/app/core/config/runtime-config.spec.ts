import {
  DEFAULT_FLOWCORE_RUNTIME_CONFIG,
  loadFlowcoreRuntimeConfig,
  normalizeRuntimeConfig,
  provideFlowcoreRuntimeConfig,
} from './runtime-config';
import { FLOWCORE_API_BASE_URL } from '../api/api-base-url';
import { FLOWCORE_REALTIME_CONFIG } from '../realtime/realtime.config';

describe('runtime config', () => {
  it('normalizes configured API and realtime values', () => {
    const config = normalizeRuntimeConfig({
      apiBaseUrl: 'https://api.flowcore.dev/api/v1/',
      realtime: {
        appKey: 'public-key',
        authEndpoint: 'https://api.flowcore.dev/api/broadcasting/auth/',
        wsHost: 'ws.flowcore.dev',
        wsPort: '443',
        forceTls: true,
      },
    });

    expect(config).toEqual({
      apiBaseUrl: 'https://api.flowcore.dev/api/v1',
      realtime: {
        appKey: 'public-key',
        authEndpoint: 'https://api.flowcore.dev/api/broadcasting/auth',
        wsHost: 'ws.flowcore.dev',
        wsPort: 443,
        forceTls: true,
      },
    });
  });

  it('falls back to local defaults for invalid optional values', () => {
    const config = normalizeRuntimeConfig({
      apiBaseUrl: '',
      realtime: {
        appKey: '',
        wsHost: '',
        wsPort: 0,
        forceTls: 'yes',
      },
    });

    expect(config).toEqual(DEFAULT_FLOWCORE_RUNTIME_CONFIG);
  });

  it('provides Angular tokens from the normalized config', () => {
    const providers = provideFlowcoreRuntimeConfig({
      apiBaseUrl: 'https://api.flowcore.dev/api/v1',
      realtime: {
        appKey: 'public-key',
        wsHost: 'ws.flowcore.dev',
        wsPort: 443,
        forceTls: true,
      },
    });

    expect(providers).toContainEqual({ provide: FLOWCORE_API_BASE_URL, useValue: 'https://api.flowcore.dev/api/v1' });
    expect(providers).toContainEqual({
      provide: FLOWCORE_REALTIME_CONFIG,
      useValue: {
        appKey: 'public-key',
        authEndpoint: 'https://api.flowcore.dev/api/broadcasting/auth',
        wsHost: 'ws.flowcore.dev',
        wsPort: 443,
        forceTls: true,
      },
    });
  });

  it('keeps local development usable when config.json is unavailable locally', async () => {
    const originalFetch = globalThis.fetch;

    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      value: jest.fn().mockResolvedValue({ ok: false, status: 404 }),
    });

    await expect(loadFlowcoreRuntimeConfig('/config.json', 'localhost')).resolves.toEqual(DEFAULT_FLOWCORE_RUNTIME_CONFIG);

    Object.defineProperty(globalThis, 'fetch', { configurable: true, value: originalFetch });
  });

  it('fails closed outside localhost when config.json is unavailable', async () => {
    const originalFetch = globalThis.fetch;

    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      value: jest.fn().mockResolvedValue({ ok: false, status: 404 }),
    });

    await expect(loadFlowcoreRuntimeConfig('/config.json', 'portfolio.example.com')).rejects.toThrow(
      'Could not load FlowCore runtime config',
    );

    Object.defineProperty(globalThis, 'fetch', { configurable: true, value: originalFetch });
  });
});
