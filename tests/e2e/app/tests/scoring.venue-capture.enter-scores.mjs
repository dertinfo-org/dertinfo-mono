/**
 * Venue administrator completes score capture for the first dance still awaiting scores.
 * The local app must be on http://localhost:44300, with image resize running.
 * The fixture entry point is fixtures/fixture-1/run.mjs. That runner applies the database pack.
 */
import { chromium } from 'playwright';
import { appContext } from '../config/device.mjs';
import { venueAdminCredentials } from '../../shared-tools/logins.mjs';
import { Auth0LoginPage } from '../pages/auth0-login.mjs';
import { CameraPage } from '../pages/camera.mjs';
import { DanceDetailPage } from '../pages/dance-detail.mjs';
import { DancesPage } from '../pages/dances.mjs';
import { HomePage } from '../pages/home.mjs';
import { VenuePage } from '../pages/venue.mjs';
import {
  beginScenario,
  closeRecordedBrowser,
  configureRecording,
  contextOptions,
  finishRun,
  finishScenario,
} from '../../shared-tools/recording.mjs';

export const id = 'scoring.venue-capture.enter-scores';

function step(name) {
  console.log(`PASS ${id} > ${name}`);
}

function fail(name, error) {
  console.error(`FAIL ${id} > ${name}`);
  console.error(error && error.stack ? error.stack : error);
}

export async function run(videoMode) {
  const { email, password } = venueAdminCredentials();
  const runDir = configureRecording(videoMode);
  if (runDir) console.log(`Recording videos (${videoMode}) to ${runDir}`);
  beginScenario(id);
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--use-fake-device-for-media-stream',
      '--use-fake-ui-for-media-stream',
    ],
  });
  const context = await browser.newContext(contextOptions(appContext({
    permissions: ['camera'],
  })));
  const page = await context.newPage();
  const home = new HomePage(page);
  const auth0Login = new Auth0LoginPage(page);
  const venue = new VenuePage(page);
  const dances = new DancesPage(page);
  const danceDetail = new DanceDetailPage(page);
  const camera = new CameraPage(page);
  let current = 'sign in';
  let passed = false;
  try {
    await home.open();
    await home.signOutIfSignedIn();
    await home.clickLogIn();
    await auth0Login.signIn(email, password);
    await home.waitUntilSignedIn();
    step(current);

    current = 'open dances';
    await venue.open();
    await venue.openFirst();
    await dances.ensureOpen();
    const teamName = await dances.openFirstExpected();
    await danceDetail.waitForTeam(teamName);
    step(current);

    current = 'reject an out-of-range score';
    const plan = await danceDetail.readScorePlan();
    await danceDetail.fillScores(plan);
    await danceDetail.fillScore(0, String(plan[0].max + 1));
    await danceDetail.waitForOutOfRange();
    if (!(await danceDetail.sendScoresDisabled())) throw new Error('Send Scores stayed enabled for an out-of-range score');
    await danceDetail.fillScore(0, plan[0].value);
    await danceDetail.waitForScoresValid();
    if (await danceDetail.sendScoresDisabled()) throw new Error('Send Scores stayed disabled after the score was corrected');
    step(current);

    current = 'send scores';
    await danceDetail.sendScores();
    await danceDetail.ensurePhotoCapture();
    step(current);

    current = 'photograph score sheets';
    await camera.capture();
    await danceDetail.waitForResizedSheets(1);
    await camera.capture();
    await danceDetail.waitForResizedSheets(2);
    step(current);

    current = 'confirm the dance is completed';
    await dances.open();
    const completedDance = await dances.completedDance(teamName);
    const stillExpected = await dances.expectedList().locator('ion-item').filter({ hasText: teamName }).count();
    if (stillExpected > 0) throw new Error(`${teamName} was still listed under Expected Dances`);
    await completedDance.click();
    await danceDetail.waitForTeam(teamName);
    step(current);

    current = 'confirm the scores and photos remain';
    await danceDetail.openScores();
    for (let index = 0; index < plan.length; index += 1) {
      const actual = await danceDetail.scoreValue(index);
      if (actual !== plan[index].value) {
        throw new Error(`${plan[index].label} was ${actual || 'empty'} after reopening, expected ${plan[index].value}`);
      }
    }
    await danceDetail.openPhotosTab();
    await danceDetail.waitForResizedSheets(2);
    step(current);

    passed = true;
    console.log(`PASS ${id}`);
  } catch (error) {
    fail(current, error);
    console.error(`FAIL ${id}`);
    process.exitCode = 1;
  } finally {
    await closeRecordedBrowser(browser, page, 'score-capture');
    finishScenario(passed);
    const kept = finishRun();
    if (videoMode !== 'none') {
      console.log(kept ? `Recordings kept in ${kept}` : 'No recordings kept.');
    }
  }
}
