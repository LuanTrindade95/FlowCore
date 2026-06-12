import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = resolve(rootDir, 'public/config.json');

const fallback = {
  apiBaseUrl: 'http://localhost:8000/api/v1',
  realtime: {
    appKey: 'flowcore-local-key',
    wsHost: 'localhost',
    wsPort: 8080,
    forceTls: false,
  },
};

const scheme = readString('FLOWCORE_REALTIME_SCHEME', process.env.VITE_REVERB_SCHEME ?? 'http');
const config = {
  apiBaseUrl: readString('FLOWCORE_API_BASE_URL', fallback.apiBaseUrl),
  realtime: {
    appKey: readString('FLOWCORE_REALTIME_APP_KEY', process.env.VITE_REVERB_APP_KEY ?? fallback.realtime.appKey),
    wsHost: readString('FLOWCORE_REALTIME_WS_HOST', process.env.VITE_REVERB_HOST ?? fallback.realtime.wsHost),
    wsPort: readNumber('FLOWCORE_REALTIME_WS_PORT', Number(process.env.VITE_REVERB_PORT) || fallback.realtime.wsPort),
    forceTls: readBoolean('FLOWCORE_REALTIME_FORCE_TLS', scheme === 'https'),
  },
};

const authEndpoint = readString('FLOWCORE_REALTIME_AUTH_ENDPOINT', '');

if (authEndpoint) {
  config.realtime.authEndpoint = authEndpoint;
}

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
console.log(`Wrote runtime config to ${outputPath}`);

function readString(name, fallbackValue) {
  const value = process.env[name];

  return value && value.trim() ? value.trim() : fallbackValue;
}

function readNumber(name, fallbackValue) {
  const value = Number(process.env[name]);

  return Number.isInteger(value) && value > 0 ? value : fallbackValue;
}

function readBoolean(name, fallbackValue) {
  const value = process.env[name];

  if (value === undefined) {
    return fallbackValue;
  }

  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}
