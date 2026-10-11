/**
 * App fixture entry point.
 * This file is the only way to start the venue score-capture journey.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { applyPack, clearRunState, loadRunConfig } from '../../../shared-tools/run-config.mjs';
import { run } from '../../tests/scoring.venue-capture.enter-scores.mjs';

// This fixture lives here, the shared database tools live in tests/e2e, and runtime files go in run-state.
const fixtureDir = path.dirname(fileURLToPath(import.meta.url));
const e2eRoot = path.resolve(fixtureDir, '../../..');
const runStateDir = path.join(fixtureDir, 'run-state');

// Read run-config.yaml, then let any command-line flags replace those values.
let runConfig;
try {
  runConfig = loadRunConfig(fixtureDir, process.argv.slice(2));
  // This fixture runs one test, so a leftover word on the command line is a mistake.
  if (runConfig.rest.length > 0) throw new Error(`Unexpected argument ${runConfig.rest[0]}`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

// Make sure the folder for cookies and other runtime files exists before the test starts.
fs.mkdirSync(runStateDir, { recursive: true });

// Put the database into the pack named by baseState, or leave it untouched when that value is none.
try {
  await applyPack(e2eRoot, runConfig.baseState);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

// Open the app and run the venue score-capture test, recording only when video asks for it.
await run(runConfig.video);

// The test records failure by setting an exit code, and a missing code means it passed.
const failed = (process.exitCode ?? 0) !== 0;

// After a pass, remove the runtime files when clearSession is true, and a failure always keeps them.
if (!failed && runConfig.clearSession) clearRunState(runStateDir);

// Stop the process with 0 for a pass and 1 for a failure.
process.exit(failed ? 1 : 0);
