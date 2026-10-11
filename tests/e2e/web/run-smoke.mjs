/**
 * Runs the website feature fixtures that have tests, in dependency order.
 * The first fixture applies system-empty. Later fixtures leave the database as it is.
 * A passing run clears shared-session. A failing run stops and leaves it.
 */
import path from 'path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'url';
import { clearRunState, sharedSessionDir } from '../shared-tools/run-config.mjs';

const webDir = path.dirname(fileURLToPath(import.meta.url));
const e2eRoot = path.resolve(webDir, '..');
const fixturesDir = path.join(webDir, 'fixtures');
const sessionDir = sharedSessionDir(e2eRoot);

const steps = [
  ['public.cookie-consent', ['--clear-session', 'false']],
  ['events.create', ['--base-state', 'none', '--clear-session', 'false']],
  ['groups.manage', ['--base-state', 'none', '--clear-session', 'false']],
  ['registration.submit', ['--base-state', 'none', '--clear-session', 'false']],
  ['registration.confirm', ['--base-state', 'none', '--clear-session', 'false']],
  ['invoicing.payment-status', ['--base-state', 'none', '--clear-session', 'false']],
  ['public.content', ['--base-state', 'none', '--clear-session', 'false']],
];

const stripFlags = new Set(['--base-state', '--clear-session']);
const valueFlags = new Set(['--video', '--event-data', '--group-data']);

export function forwardedSmokeArgs(argv) {
  const forwarded = [];
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('--')) {
      throw new Error(`Run one feature with node web/fixtures/<feature>/run.mjs. Unexpected ${arg}`);
    }
    const equals = arg.indexOf('=');
    const flag = equals === -1 ? arg : arg.slice(0, equals);
    if (stripFlags.has(flag)) {
      if (equals === -1) index += 1;
      continue;
    }
    if (valueFlags.has(flag) && equals === -1) {
      const value = argv[index + 1];
      if (value == null || value === '' || value.startsWith('--')) {
        throw new Error(`${flag} needs a value`);
      }
      forwarded.push(flag, value);
      index += 1;
      continue;
    }
    forwarded.push(arg);
  }
  return forwarded;
}

const invokedDirectly = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  let forwarded;
  try {
    forwarded = forwardedSmokeArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }

  clearRunState(sessionDir);

  let failed = false;
  for (const [id, flags] of steps) {
    console.log(`\n${'='.repeat(72)}\nFixture ${id}\n${'='.repeat(72)}`);
    const code = await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [path.join(fixturesDir, id, 'run.mjs'), ...forwarded, ...flags], {
        stdio: 'inherit',
      });
      child.on('error', reject);
      child.on('close', resolve);
    });
    if (code !== 0) {
      failed = true;
      break;
    }
  }

  if (!failed) clearRunState(sessionDir);
  process.exit(failed ? 1 : 0);
}
