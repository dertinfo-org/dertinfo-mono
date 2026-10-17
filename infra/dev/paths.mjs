/**
 * Shared constants and helpers for local-native orchestration.
 */
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crossSpawn from 'cross-spawn';

const spawnSync = crossSpawn.sync;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEV_DIR = __dirname;
export const REPO_ROOT = path.resolve(__dirname, '../..');
export const PIDS_PATH = path.join(DEV_DIR, '.pids.json');
export const RUNTIME_PATH = path.join(DEV_DIR, 'runtime.json');
export const RUNTIME_EXAMPLE_PATH = path.join(DEV_DIR, 'runtime.example.json');
export const SECRETS_DIR = path.join(REPO_ROOT, 'infra', 'secrets');
export const API_ENV_PATH = path.join(SECRETS_DIR, 'api.env');
export const API_ENV_EXAMPLE_PATH = path.join(SECRETS_DIR, 'api.env.example');
export const DATA_DIR = path.join(REPO_ROOT, 'infra', 'data');
export const AZURITE_DATA_DIR = path.join(DATA_DIR, 'azurite');

export const PORTS = {
  api: 44100,
  web: 44200,
  app: 44300,
  imageResize: 44400,
  /** Docker SQL Server published port (compose sqlserver). */
  sql: 44000,
  /** Angular ng serve (proxied by SWA CLI onto web/app ports). */
  webNg: 4200,
  appNg: 4201,
  azuriteBlob: 10000,
  azuriteQueue: 10001,
  azuriteTable: 10002,
};

/** Compose service names in root docker-compose.yml */
export const COMPOSE_SERVICES = {
  api: 'dertinfo-api',
  web: 'web-frontend',
  app: 'app-frontend',
  imageResize: 'functions',
  azurite: 'azstorage',
  sql: 'sqlserver',
};

export const MODES = ['native', 'docker', 'off'];
export const SERVICES_WITH_HOT_RELOAD = ['api', 'web', 'app', 'imageResize'];

export const PATHS = {
  apiProject: path.join(REPO_ROOT, 'apps', 'dert-api', 'src', 'dertinfo-api', 'dertinfo-api.csproj'),
  apiCwd: path.join(REPO_ROOT, 'apps', 'dert-api', 'src'),
  webClient: path.join(REPO_ROOT, 'apps', 'dert-web', 'src', 'client'),
  appClient: path.join(REPO_ROOT, 'apps', 'dert-app', 'src', 'client'),
  functionsDir: path.join(REPO_ROOT, 'apps', 'dert-functions', 'src', 'dertinfo-image-resize'),
  /** Explicit csproj — avoids func discovering WorkerExtensions.csproj under obj/. */
  functionsProject: path.join(
    REPO_ROOT,
    'apps',
    'dert-functions',
    'src',
    'dertinfo-image-resize',
    'DertInfoImageResizeV4.csproj',
  ),
  /** Built output used as func --script-root (source tree has 2 .csproj after build). */
  functionsScriptRoot: path.join(
    REPO_ROOT,
    'apps',
    'dert-functions',
    'src',
    'dertinfo-image-resize',
    'bin',
    'Debug',
    'net8.0',
  ),
  functionsSettings: path.join(
    REPO_ROOT,
    'apps',
    'dert-functions',
    'src',
    'dertinfo-image-resize',
    'local.settings.json',
  ),
  functionsSettingsExample: path.join(
    REPO_ROOT,
    'apps',
    'dert-functions',
    'src',
    'dertinfo-image-resize',
    'local.settings.json.example',
  ),
};

/** Services that npm run start can manage. */
export const RUNTIME_SERVICE_KEYS = ['api', 'web', 'app', 'imageResize', 'azurite', 'sql'];

/** Defaults when runtime.json is missing (recommended website + API day-to-day). */
export const DEFAULT_RUNTIME = {
  api: { mode: 'native', rebuild: false, hotReload: true },
  web: { mode: 'native', rebuild: false, hotReload: true },
  app: { mode: 'off', rebuild: false },
  imageResize: { mode: 'native', rebuild: false, hotReload: false },
  azurite: { mode: 'native', rebuild: false },
  sql: { mode: 'off', rebuild: false },
};

function parseServiceConfig(key, value, relPath) {
  if (typeof value === 'boolean') {
    throw new Error(
      `${relPath}: "${key}" must be an object { mode, rebuild[, hotReload] }, not a boolean. ` +
        `See ${path.relative(REPO_ROOT, RUNTIME_EXAMPLE_PATH)}.`,
    );
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(
      `${relPath}: "${key}" must be an object (got ${JSON.stringify(value)}). ` +
        `See ${path.relative(REPO_ROOT, RUNTIME_EXAMPLE_PATH)}.`,
    );
  }
  const { mode, rebuild, hotReload } = value;
  if (!MODES.includes(mode)) {
    throw new Error(
      `${relPath}: "${key}.mode" must be one of ${MODES.join('|')} (got ${JSON.stringify(mode)})`,
    );
  }
  if (typeof rebuild !== 'boolean') {
    throw new Error(
      `${relPath}: "${key}.rebuild" must be a boolean (got ${JSON.stringify(rebuild)})`,
    );
  }
  const cfg = { mode, rebuild };
  if (SERVICES_WITH_HOT_RELOAD.includes(key)) {
    if (hotReload === undefined) {
      cfg.hotReload = DEFAULT_RUNTIME[key].hotReload ?? false;
    } else if (typeof hotReload !== 'boolean') {
      throw new Error(
        `${relPath}: "${key}.hotReload" must be a boolean (got ${JSON.stringify(hotReload)})`,
      );
    } else {
      cfg.hotReload = hotReload;
    }
  }
  return cfg;
}

/**
 * Load infra/dev/runtime.json. Missing file → DEFAULT_RUNTIME.
 * Strict object schema only (no boolean compatibility).
 */
export function loadRuntime() {
  const relPath = path.relative(REPO_ROOT, RUNTIME_PATH);
  if (!fs.existsSync(RUNTIME_PATH)) {
    return JSON.parse(JSON.stringify(DEFAULT_RUNTIME));
  }
  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(RUNTIME_PATH, 'utf8'));
  } catch (err) {
    throw new Error(`Invalid ${relPath}: ${err.message}`);
  }
  const runtime = JSON.parse(JSON.stringify(DEFAULT_RUNTIME));
  for (const key of RUNTIME_SERVICE_KEYS) {
    if (raw[key] === undefined) continue;
    runtime[key] = parseServiceConfig(key, raw[key], relPath);
  }
  return runtime;
}

export function enabledServices(runtime) {
  return RUNTIME_SERVICE_KEYS.filter((k) => runtime[k].mode !== 'off');
}

export function anyMode(runtime, mode) {
  return RUNTIME_SERVICE_KEYS.some((k) => runtime[k].mode === mode);
}

/** Required keys in api.env (env-style names). Secrets + machine/tenant-specific settings. */
export const REQUIRED_SECRET_KEYS = [
  'SqlConnection__ServerName',
  'SqlConnection__ServerAdminName',
  'SqlConnection__ServerAdminPassword',
  'SqlConnection__DatabaseName',
  'Auth0__Domain',
  'Auth0__Audience',
  'Auth0__ManagementClientId',
  'Auth0__ManagementClientSecret',
  'WebClient__Auth0__ClientId',
  'PwaClient__Auth0__ClientId',
  'StorageAccount__Images__Key',
];

export function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  const result = {};
  for (const raw of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[line.slice(0, eq).trim()] = value;
  }
  return result;
}

/** Map env __ keys to configuration : keys and merge for process env. */
export function envFileToProcessEnv(filePath) {
  const parsed = parseEnvFile(filePath);
  const out = {};
  for (const [key, value] of Object.entries(parsed)) {
    out[key] = value;
  }
  return out;
}

export function configKey(envKey) {
  return envKey.replaceAll('__', ':');
}

export function readAppsettingsDefaults() {
  const p = path.join(
    REPO_ROOT,
    'apps',
    'dert-api',
    'src',
    'dertinfo-api',
    'appsettings.json',
  );
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

export function commandExists(command) {
  const probe = process.platform === 'win32' ? 'where' : 'which';
  const r = spawnSync(probe, [command], { encoding: 'utf8', shell: false });
  return r.status === 0 && Boolean(r.stdout && r.stdout.trim());
}

/**
 * Minimum Azurite for Functions Core Tools 4.12+ (Storage API 2024-11-04).
 * 3.31.0 rejects that API; use azurite@latest (3.34+ recommended).
 */
export const MIN_AZURITE_VERSION = '3.34.0';

/** Azure Functions Core Tools major line for local image-resize. */
export const MIN_FUNC_CORE_TOOLS_MAJOR = 4;

/** Parse leading x.y.z from CLI version output. */
export function parseSemver(text) {
  const m = String(text || '').match(/(\d+)\.(\d+)\.(\d+)/);
  if (!m) return null;
  return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]), raw: `${m[1]}.${m[2]}.${m[3]}` };
}

export function semverGte(version, minimum) {
  const a = typeof version === 'string' ? parseSemver(version) : version;
  const b = typeof minimum === 'string' ? parseSemver(minimum) : minimum;
  if (!a || !b) return false;
  if (a.major !== b.major) return a.major > b.major;
  if (a.minor !== b.minor) return a.minor > b.minor;
  return a.patch >= b.patch;
}

/** Run `cmd --version` (or args) and return trimmed stdout+stderr. */
export function toolVersionOutput(command, args = ['--version']) {
  const r = spawnSync(command, args, { encoding: 'utf8' });
  return `${r.stdout || ''}${r.stderr || ''}`.trim();
}

export function portOpen(port, host = '127.0.0.1', timeoutMs = 800) {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host });
    const done = (ok) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(timeoutMs);
    socket.on('connect', () => done(true));
    socket.on('timeout', () => done(false));
    socket.on('error', () => done(false));
  });
}

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}
