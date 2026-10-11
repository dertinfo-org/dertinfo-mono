/**
 * Reads a fixture's run-config.yaml and applies command-line overrides.
 * Comments in that file are ignored.
 */
import fs from 'fs';
import path from 'path';
import { spawn } from 'node:child_process';

const BASE_STATES = new Set(['system-empty', 'system-basic', 'none']);
const VIDEO_MODES = new Set(['none', 'errors', 'all']);
const FLAGS = new Set(['--base-state', '--video', '--clear-session', '--event-data', '--group-data']);

export function loadRunConfig(fixtureDir, argv) {
  const filePath = path.join(fixtureDir, 'run-config.yaml');
  if (!fs.existsSync(filePath)) throw new Error(`Missing ${filePath}`);
  const config = parseRunConfigYaml(fs.readFileSync(filePath, 'utf8'), filePath);
  const rest = [];
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--') continue;
    const equals = arg.indexOf('=');
    const flag = equals === -1 ? arg : arg.slice(0, equals);
    if (!FLAGS.has(flag)) {
      rest.push(arg);
      continue;
    }
    const value = equals === -1 ? argv[index + 1] : arg.slice(equals + 1);
    if (equals === -1) index += 1;
    if (value == null || value === '' || value.startsWith('--')) {
      throw new Error(`${flag} needs a value`);
    }
    if (flag === '--base-state') config.baseState = value;
    if (flag === '--video') config.video = value;
    if (flag === '--event-data') config.eventData = value;
    if (flag === '--group-data') config.groupData = value;
    if (flag === '--clear-session') {
      if (value !== 'true' && value !== 'false') throw new Error('--clear-session must be true or false');
      config.clearSession = value === 'true';
    }
  }
  if (!BASE_STATES.has(config.baseState)) {
    throw new Error(`baseState must be system-empty, system-basic, or none (got ${config.baseState})`);
  }
  if (config.video == null) config.video = 'none';
  if (!VIDEO_MODES.has(config.video)) {
    throw new Error(`video must be none, errors, or all (got ${config.video})`);
  }
  if (config.clearSession == null) config.clearSession = true;
  if (typeof config.clearSession !== 'boolean') {
    throw new Error('clearSession must be true or false');
  }
  config.requires = parseRequires(config.requires);
  return { ...config, rest };
}

function parseRequires(value) {
  if (value == null || value === '[]') return [];
  const names = String(value).split(',').map((name) => name.trim()).filter(Boolean);
  if (names.some((name) => name === '[]')) {
    throw new Error('requires must be [] or a comma-separated list of fixture ids');
  }
  return names;
}

/** Flat key: value file. Full-line and trailing comments are skipped. */
function parseRunConfigYaml(text, filePath) {
  const config = {};
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (line === '' || line.startsWith('#')) continue;
    const commentAt = line.search(/\s+#/);
    const body = (commentAt === -1 ? line : line.slice(0, commentAt)).trim();
    const colon = body.indexOf(':');
    if (colon <= 0) throw new Error(`Cannot read ${filePath}: ${raw.trim()}`);
    const key = body.slice(0, colon).trim();
    let value = body.slice(colon + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (value === 'true') config[key] = true;
    else if (value === 'false') config[key] = false;
    else if (value === '') throw new Error(`Cannot read ${filePath}: ${key} has no value`);
    else config[key] = value;
  }
  return config;
}

/** Point loadData.js at the event and group files named by the config. Call this before importing tests. */
export function applyDataSet(config) {
  if (config.eventData) process.env.DERTINFO_E2E_EVENT_DATA = config.eventData;
  if (config.groupData) process.env.DERTINFO_E2E_GROUP_DATA = config.groupData;
}

export function applyPack(e2eRoot, baseState) {
  if (baseState === 'none') return Promise.resolve();
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['shared-state/apply.mjs', baseState], {
      cwd: e2eRoot,
      stdio: 'inherit',
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${baseState} apply exited ${code}`));
    });
  });
}

export function sharedSessionDir(e2eRoot) {
  return path.join(e2eRoot, 'shared-session');
}

export function clearRunState(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir)) {
    if (entry === '.gitkeep' || entry === 'README.md') continue;
    fs.rmSync(path.join(dir, entry), { recursive: true, force: true });
  }
}
