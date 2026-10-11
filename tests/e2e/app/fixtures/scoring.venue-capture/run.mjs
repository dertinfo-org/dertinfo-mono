/**
 * App fixture entry point.
 * This file is the only way to start the venue score-capture journey.
 * One video covers the whole fixture.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { chromium } from 'playwright';
import { appContext } from '../../config/device.mjs';
import { Auth0LoginPage } from '../../pages/auth0-login.mjs';
import { CameraPage } from '../../pages/camera.mjs';
import { DanceDetailPage } from '../../pages/dance-detail.mjs';
import { DancesPage } from '../../pages/dances.mjs';
import { HomePage } from '../../pages/home.mjs';
import { VenuePage } from '../../pages/venue.mjs';
import { applyPack, clearRunState, loadRunConfig, sharedSessionDir } from '../../../shared-tools/run-config.mjs';
import {
  beginScenario,
  closeRecordedBrowser,
  configureRecording,
  contextOptions,
  finishRun,
  finishScenario,
} from '../../../shared-tools/recording.mjs';

const fixtureDir = path.dirname(fileURLToPath(import.meta.url));
const e2eRoot = path.resolve(fixtureDir, '../../..');
const runStateDir = sharedSessionDir(e2eRoot);
const testsDir = path.resolve(fixtureDir, '../../tests');
const featureId = 'scoring.venue-capture';

const testFiles = [
  'scoring.venue-admin.signs-in.mjs',
  'scoring.venue-admin.opens-first-dance.mjs',
  'scoring.venue-admin.rejects-out-of-range-score.mjs',
  'scoring.venue-admin.sends-scores.mjs',
  'scoring.venue-admin.photographs-score-sheets.mjs',
  'scoring.venue-admin.confirms-dance-completed.mjs',
  'scoring.venue-admin.confirms-scores-and-photos.mjs',
];

// This fixture lives here, the shared database tools live in tests/e2e, and session files go in shared-session.
// Read run-config.yaml, then let any command-line flags replace those values.
let runConfig;
try {
  runConfig = loadRunConfig(fixtureDir, process.argv.slice(2));
  if (runConfig.rest.length > 0) throw new Error(`Unexpected argument ${runConfig.rest[0]}`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

// Make sure the folder for runtime files exists before the tests start.
fs.mkdirSync(runStateDir, { recursive: true });

// Put the database into the pack named by baseState, or leave it untouched when that value is none.
try {
  await applyPack(e2eRoot, runConfig.baseState);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

// Record one video for this fixture, then open the app once and run each scenario in order.
const runDir = configureRecording(runConfig.video);
if (runDir) console.log(`Recording videos (${runConfig.video}) to ${runDir}`);
beginScenario(featureId);

const tests = [];
for (const fileName of testFiles) {
  const imported = await import(pathToFileURL(path.join(testsDir, fileName)).href);
  if (!imported.id || typeof imported.run !== 'function') {
    throw new Error(`${fileName} must export id and run`);
  }
  tests.push(imported);
}

let browser;
let page;
let failed = false;
try {
  browser = await chromium.launch({
    headless: true,
    args: [
      '--use-fake-device-for-media-stream',
      '--use-fake-ui-for-media-stream',
    ],
  });
  const context = await browser.newContext(contextOptions(appContext({
    permissions: ['camera'],
  })));
  page = await context.newPage();
  const ctx = {
    page,
    home: new HomePage(page),
    auth0Login: new Auth0LoginPage(page),
    venue: new VenuePage(page),
    dances: new DancesPage(page),
    danceDetail: new DanceDetailPage(page),
    camera: new CameraPage(page),
  };
  for (const test of tests) {
    try {
      await test.run(ctx);
      console.log(`PASS ${test.id}`);
    } catch (error) {
      console.error(`FAIL ${test.id}`);
      console.error(error && error.stack ? error.stack : error);
      failed = true;
      break;
    }
  }
} catch (error) {
  console.error(error && error.stack ? error.stack : error);
  failed = true;
} finally {
  if (browser && page) await closeRecordedBrowser(browser, page, 'score-capture');
  else if (browser) await browser.close();
  finishScenario(!failed);
  const kept = finishRun();
  if (runConfig.video !== 'none') {
    console.log(kept ? `Recordings kept in ${kept}` : 'No recordings kept.');
  }
}

// After a pass, remove the runtime files when clearSession is true, and a failure always keeps them.
if (!failed && runConfig.clearSession) clearRunState(runStateDir);

// Stop the process with 0 for a pass and 1 for a failure.
process.exit(failed ? 1 : 0);
