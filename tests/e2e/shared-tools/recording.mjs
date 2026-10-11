/**
 * Video recording for the website smoke suite and the app fixtures.
 * none records nothing. all keeps every clip. errors keeps clips only when the scenario fails.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const VIDEO_MODES = new Set(['none', 'errors', 'all']);
const RUN_FOLDER = /^(\d{8})-(\d{4})(?:-(\d+))?$/;
const VIDEO_SIZE = { width: 1400, height: 900 };

const here = path.dirname(fileURLToPath(import.meta.url));
const recordingsRoot = path.resolve(here, '../../..', '_recordings');

let mode = 'none';
let runDir = null;
let scenarioDir = null;
let clip = 0;

/** Pull `--video` out of the runner arguments. A bare `--` is npm's separator and is ignored. */
export function takeVideoMode(argv) {
  const rest = [];
  let selected = 'none';
  let seen = false;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--') continue;
    if (arg === '--video' || arg.startsWith('--video=')) {
      if (seen) throw new Error('--video can only be set once');
      const value = arg === '--video' ? argv[i + 1] : arg.slice('--video='.length);
      if (arg === '--video') i += 1;
      if (value == null || value === '' || value.startsWith('--')) {
        throw new Error('--video needs a value: none, errors, or all');
      }
      selected = value;
      seen = true;
      continue;
    }
    rest.push(arg);
  }
  if (!VIDEO_MODES.has(selected)) {
    throw new Error(`--video must be none, errors, or all (got ${selected})`);
  }
  return { mode: selected, rest };
}

function stamp(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`;
}

function runFolderRank(name) {
  const match = name.match(RUN_FOLDER);
  if (!match) return null;
  return [match[1], match[2], Number(match[3] || 1)];
}

/** Keep the three newest YYYYMMDD-HHMM folders. Other names in the directory are left alone. */
export function pruneTimestampFolders(root) {
  if (!fs.existsSync(root)) return;
  const names = fs.readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && runFolderRank(entry.name))
    .map((entry) => entry.name)
    .sort((left, right) => {
      const a = runFolderRank(left);
      const b = runFolderRank(right);
      if (a[0] !== b[0]) return a[0] < b[0] ? 1 : -1;
      if (a[1] !== b[1]) return a[1] < b[1] ? 1 : -1;
      return b[2] - a[2];
    });
  for (const name of names.slice(3)) {
    fs.rmSync(path.join(root, name), { recursive: true, force: true });
  }
}

/** Start a run. Returns the run folder when recording, otherwise null. */
export function configureRecording(nextMode, now = new Date()) {
  if (!VIDEO_MODES.has(nextMode)) {
    throw new Error(`--video must be none, errors, or all (got ${nextMode})`);
  }
  mode = nextMode;
  runDir = null;
  scenarioDir = null;
  clip = 0;
  if (mode === 'none') return null;
  fs.mkdirSync(recordingsRoot, { recursive: true });
  const base = stamp(now);
  let name = base;
  let suffix = 2;
  while (fs.existsSync(path.join(recordingsRoot, name))) {
    name = `${base}-${suffix}`;
    suffix += 1;
  }
  runDir = path.join(recordingsRoot, name);
  fs.mkdirSync(runDir);
  return runDir;
}

export function recordingMode() {
  return mode;
}

/** Open a subfolder for this scenario. No-op when recording is off. */
export function beginScenario(id) {
  clip = 0;
  scenarioDir = null;
  if (mode === 'none' || !runDir) return;
  const safe = String(id).replace(/[^A-Za-z0-9._-]/g, '_');
  if (!safe || safe === '.' || safe === '..') {
    throw new Error(`Cannot record scenario ${id}`);
  }
  scenarioDir = path.join(runDir, safe);
  fs.mkdirSync(scenarioDir);
}

/** Browser context options, including recordVideo when this run is recording. */
export function contextOptions(extra = {}) {
  const { videoSize, ...context } = extra;
  if (mode === 'none' || !scenarioDir) return context;
  return {
    ...context,
    recordVideo: { dir: scenarioDir, size: videoSize || VIDEO_SIZE },
  };
}

/**
 * Close the browser, then rename the saved video to `NN-label.webm`.
 * The file is only complete after the context closes.
 */
export async function closeRecordedBrowser(browser, page, label) {
  const video = mode === 'none' || !scenarioDir ? null : page.video();
  await page.context().close();
  await browser.close();
  if (!video) return;
  const src = await video.path();
  clip += 1;
  const safeLabel = String(label).replace(/[^A-Za-z0-9-]/g, '-') || 'clip';
  const dest = path.join(scenarioDir, `${String(clip).padStart(2, '0')}-${safeLabel}.webm`);
  fs.renameSync(src, dest);
}

/** Drop the scenario folder when it is empty, or when errors-only mode and the scenario passed. */
export function finishScenario(passed) {
  if (!scenarioDir) return;
  const dir = scenarioDir;
  scenarioDir = null;
  if (!fs.existsSync(dir)) return;
  const empty = fs.readdirSync(dir).length === 0;
  if (empty || (mode === 'errors' && passed)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/** Remove an empty run folder, then keep only the three newest timestamp folders. */
export function finishRun() {
  if (mode === 'none' || !runDir) return null;
  const dir = runDir;
  if (fs.existsSync(dir) && fs.readdirSync(dir).length === 0) {
    fs.rmSync(dir, { recursive: true, force: true });
    runDir = null;
  }
  pruneTimestampFolders(recordingsRoot);
  return runDir;
}
