/**
 * Runs one app feature fixture: restore the group-member persona, apply the pack,
 * then run that feature's tests in one signed-in browser.
 */
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { chromium } from 'playwright';
import { appContext } from './config/device.mjs';
import { basicGroupMembership } from './config/basic-groups.mjs';
import { Auth0LoginPage } from './pages/auth0-login.mjs';
import { DanceDetailPage } from './pages/dance-detail.mjs';
import { DancesPage } from './pages/dances.mjs';
import { HomePage } from './pages/home.mjs';
import { ProfilePage } from './pages/profile.mjs';
import { applyPack, clearRunState, loadRunConfig, sharedSessionDir } from '../shared-tools/run-config.mjs';
import { restorePersonaClaim } from '../shared-tools/auth0-persona.mjs';
import {
  beginScenario,
  closeRecordedBrowser,
  configureRecording,
  contextOptions,
  finishRun,
  finishScenario,
} from '../shared-tools/recording.mjs';

export async function runAppFeature({ fixtureDir, featureId, testFiles, clipLabel }) {
  const e2eRoot = path.resolve(fixtureDir, '../../..');
  const runStateDir = sharedSessionDir(e2eRoot);
  const testsDir = path.resolve(fixtureDir, '../../tests');

  let runConfig;
  try {
    runConfig = loadRunConfig(fixtureDir, process.argv.slice(2));
    if (runConfig.rest.length > 0) throw new Error(`Unexpected argument ${runConfig.rest[0]}`);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }

  fs.mkdirSync(runStateDir, { recursive: true });

  const membership = basicGroupMembership();
  try {
    await restorePersonaClaim(membership.email, 'groupmember', membership.memberGroupIds);
    await applyPack(e2eRoot, runConfig.baseState);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }

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
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext(contextOptions(appContext()));
    page = await context.newPage();
    const ctx = {
      page,
      home: new HomePage(page),
      auth0Login: new Auth0LoginPage(page),
      profile: new ProfilePage(page),
      dances: new DancesPage(page),
      danceDetail: new DanceDetailPage(page),
      membership,
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
    if (browser && page) await closeRecordedBrowser(browser, page, clipLabel);
    else if (browser) await browser.close();
    finishScenario(!failed);
    const kept = finishRun();
    if (runConfig.video !== 'none') {
      console.log(kept ? `Recordings kept in ${kept}` : 'No recordings kept.');
    }
  }

  if (!failed && runConfig.clearSession) clearRunState(runStateDir);
  process.exit(failed ? 1 : 0);
}
