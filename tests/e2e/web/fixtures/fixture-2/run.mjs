/**
 * Login warmup fixture entry point.
 * Database, video, and session cleanup come from run-config.yaml.
 * Command-line flags override that file.
 * Run: npm run test:login:warmup  (from tests/e2e)
 */
import fs from 'fs';
import path from 'path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { applyPack, clearRunState, loadRunConfig, sharedSessionDir } from '../../../shared-tools/run-config.mjs';

const fixtureDir = path.dirname(fileURLToPath(import.meta.url));
const e2eRoot = path.resolve(fixtureDir, '../../..');
const testsDir = path.resolve(fixtureDir, '../../tests');
const runStateDir = sharedSessionDir(e2eRoot);

const tests = [
  'warmup.signed-in.records-full-flow.mjs',
  'warmup.signed-in.sticks-on-slow-status.mjs',
  'warmup.signed-in.reaches-dashboard.mjs',
  'warmup.signed-in.stays-after-refresh.mjs',
  'warmup.signed-in.records-url-history.mjs',
  'warmup.signed-in.compares-hang-with-auth-failure.mjs',
];

let runConfig;
try {
  runConfig = loadRunConfig(fixtureDir, process.argv.slice(2));
  if (runConfig.rest.length > 0) throw new Error(`Unexpected argument ${runConfig.rest[0]}`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
if (runConfig.video !== 'none') {
  console.log('This fixture opens its own browsers and does not record video.');
}

fs.mkdirSync(runStateDir, { recursive: true });
let failed = false;
try {
  await applyPack(e2eRoot, runConfig.baseState);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

for (const test of tests) {
  const scriptPath = path.join(testsDir, test);
  console.log('\n' + '='.repeat(72));
  console.log(`Running ${test}`);
  console.log('='.repeat(72));
  const code = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath], {
      stdio: 'inherit',
      cwd: e2eRoot,
    });
    child.on('error', reject);
    child.on('close', resolve);
  });
  if (code !== 0) {
    console.error(`${test} exited ${code}`);
    failed = true;
    break;
  }
}

if (!failed && runConfig.clearSession) clearRunState(runStateDir);
if (!failed) console.log('\nAll warmup login tests completed.');
process.exit(failed ? 1 : 0);
