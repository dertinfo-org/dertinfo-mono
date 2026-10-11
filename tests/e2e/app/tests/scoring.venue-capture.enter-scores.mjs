/**
 * Venue administrator completes score capture for the first dance still awaiting scores.
 * The local app must be on http://localhost:44300, with image resize running.
 * Apply system-basic first: npm run apply:state -- system-basic
 * Video matches the website smoke suite: npm run test:app:core -- --video all
 */
import { chromium } from 'playwright';
import { venueAdminCredentials } from '../utils/logins.mjs';
import {
  beginScenario,
  closeRecordedBrowser,
  configureRecording,
  contextOptions,
  finishRun,
  finishScenario,
  takeVideoMode,
} from '../../web/smoke/recording.mjs';

const APP_BASE = 'http://localhost:44300';
const id = 'scoring.venue-capture.enter-scores';

function step(name) {
  console.log(`PASS ${id} > ${name}`);
}

function fail(name, error) {
  console.error(`FAIL ${id} > ${name}`);
  console.error(error && error.stack ? error.stack : error);
}

async function signIn(page, email, password) {
  await page.goto(`${APP_BASE}/home`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  const login = page.getByRole('button', { name: /log in/i });
  const logout = page.getByRole('button', { name: /log out/i });
  await login.or(logout).waitFor({ state: 'visible', timeout: 30000 });
  if (await logout.isVisible()) {
    await logout.click();
    await login.waitFor({ state: 'visible', timeout: 20000 });
  }
  await login.click();

  const username = page.locator('input[name="username"], input[name="email"], input#username').first();
  await username.waitFor({ state: 'visible', timeout: 30000 });
  await username.fill(email);
  let passwordBox = page.locator('input[name="password"], input#password').first();
  if (!(await passwordBox.isVisible().catch(() => false))) {
    await page.locator('button[type="submit"], button[name="action"]').first().click();
    passwordBox = page.locator('input[name="password"], input#password').first();
    await passwordBox.waitFor({ state: 'visible', timeout: 15000 });
  }
  await passwordBox.fill(password);
  await page.locator('button[type="submit"], button[name="action"]').first().click();
  await logout.waitFor({ state: 'visible', timeout: 90000 });
}

async function openDances(page) {
  await page.locator('#inbox-list').getByText('Venue', { exact: true }).click();
  await page.getByText('Your Venues').waitFor({ state: 'visible', timeout: 30000 });
  const venueList = page.locator('ion-list').filter({ hasText: 'Your Venues' });
  const venue = venueList.locator('ion-item').first();
  if (await venue.count() === 0) throw new Error('No venue was listed for the venue administrator');
  await venue.click();
  const expectedHeading = page.getByText('Expected Dances');
  try {
    await expectedHeading.waitFor({ state: 'visible', timeout: 3000 });
  } catch {
    await page.locator('#inbox-list').getByText('Dances', { exact: true }).click();
    await expectedHeading.waitFor({ state: 'visible', timeout: 30000 });
  }
}

function scoreRows(page) {
  return page.locator('form ion-item').filter({ has: page.locator('ion-input') });
}

async function readScorePlan(page) {
  const rows = scoreRows(page);
  await rows.first().waitFor({ state: 'visible', timeout: 30000 });
  const count = await rows.count();
  const plan = [];
  for (let index = 0; index < count; index += 1) {
    const label = (await rows.nth(index).locator('ion-label').innerText()).replace(/\s+/g, ' ').trim();
    const match = label.match(/\[(\d+)\s*marks\]/i);
    if (!match) throw new Error(`Score label did not include a maximum: ${label}`);
    const max = Number(match[1]);
    plan.push({ label, max, value: max >= 1 ? '1' : '0' });
  }
  return plan;
}

async function buttonDisabled(button) {
  return button.evaluate((element) => element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true');
}

async function fillScore(row, value) {
  const box = row.getByRole('textbox');
  await box.click();
  await box.fill(value);
  await box.blur();
}

async function captureSheet(page) {
  await page.locator('photo-button').getByRole('button', { name: /Take Photo/ }).click();
  const shutter = page.locator('.shutter-button');
  await shutter.waitFor({ state: 'visible', timeout: 15000 });
  await shutter.click();
  const accept = page.locator('.item.accept-use');
  await accept.waitFor({ state: 'visible', timeout: 15000 });
  await accept.click();
}

async function waitForResizedSheets(page, count) {
  await page.waitForFunction((expected) => {
    const images = [...document.querySelectorAll('photo-widget img')];
    const ready = images.filter((img) => {
      const src = `${img.getAttribute('src') || ''} ${img.src || ''}`;
      return src.includes('/480x360/')
        && !src.includes('loading-avatar')
        && !src.includes('missing-document')
        && !src.includes('broken.png')
        && img.complete
        && img.naturalWidth > 0;
    });
    return ready.length >= expected;
  }, count, { timeout: 45000 });
}

async function run(videoMode) {
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
  const context = await browser.newContext(contextOptions({
    viewport: { width: 1400, height: 900 },
    locale: 'en-GB',
    timezoneId: 'Europe/London',
    permissions: ['camera'],
  }));
  const page = await context.newPage();
  let current = 'sign in';
  let passed = false;
  try {
    await signIn(page, email, password);
    step(current);

    current = 'open dances';
    await openDances(page);
    const expected = page.locator('ion-list').filter({ has: page.getByText('Expected Dances', { exact: true }) });
    const firstDance = expected.locator('ion-item').first();
    if (await firstDance.count() === 0) {
      throw new Error('No dance is awaiting scores. Apply system-basic, or use a database that still has an expected dance.');
    }
    const teamName = (await firstDance.locator('h2').innerText()).trim();
    await firstDance.click();
    await page.getByRole('heading', { name: teamName, exact: true }).waitFor({ timeout: 30000 });
    step(current);

    current = 'reject an out-of-range score';
    const plan = await readScorePlan(page);
    const rows = scoreRows(page);
    for (let index = 0; index < plan.length; index += 1) {
      await fillScore(rows.nth(index), plan[index].value);
    }
    await fillScore(rows.nth(0), String(plan[0].max + 1));
    await rows.nth(0).locator('ion-input.has-error').waitFor({ state: 'attached', timeout: 5000 });
    const send = page.getByRole('button', { name: /Send Scores/ });
    if (!(await buttonDisabled(send))) throw new Error('Send Scores stayed enabled for an out-of-range score');
    await fillScore(rows.nth(0), plan[0].value);
    await page.waitForFunction(() => !document.querySelector('form ion-input.has-error'));
    if (await buttonDisabled(send)) throw new Error('Send Scores stayed disabled after the score was corrected');
    step(current);

    current = 'send scores';
    await send.click();
    const takePhoto = page.locator('photo-button').getByRole('button', { name: /Take Photo/ });
    try {
      await takePhoto.waitFor({ state: 'visible', timeout: 5000 });
    } catch {
      await page.getByRole('tab', { name: 'Photos' }).click();
      await takePhoto.waitFor({ state: 'visible', timeout: 15000 });
    }
    step(current);

    current = 'photograph score sheets';
    await captureSheet(page);
    await waitForResizedSheets(page, 1);
    await captureSheet(page);
    await waitForResizedSheets(page, 2);
    step(current);

    current = 'confirm the dance is completed';
    await page.locator('#inbox-list').getByText('Dances', { exact: true }).click();
    const completed = page.locator('ion-list').filter({ has: page.getByText('Completed Dances', { exact: true }) });
    const completedDance = completed.locator('ion-item').filter({ hasText: teamName });
    await completedDance.waitFor({ state: 'visible', timeout: 30000 });
    const stillExpected = await expected.locator('ion-item').filter({ hasText: teamName }).count();
    if (stillExpected > 0) throw new Error(`${teamName} was still listed under Expected Dances`);
    await completedDance.click();
    await page.getByRole('heading', { name: teamName, exact: true }).waitFor({ timeout: 30000 });
    step(current);

    current = 'confirm the scores and photos remain';
    await page.getByRole('tab', { name: 'Scores' }).click();
    const saved = scoreRows(page);
    await saved.first().waitFor({ state: 'visible', timeout: 30000 });
    for (let index = 0; index < plan.length; index += 1) {
      const actual = (await saved.nth(index).getByRole('textbox').inputValue()).trim();
      if (actual !== plan[index].value) {
        throw new Error(`${plan[index].label} was ${actual || 'empty'} after reopening, expected ${plan[index].value}`);
      }
    }
    await page.getByRole('tab', { name: 'Photos' }).click();
    await waitForResizedSheets(page, 2);
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

let videoMode = 'none';
try {
  const parsed = takeVideoMode(process.argv.slice(2));
  videoMode = parsed.mode;
  if (parsed.rest.length > 0) throw new Error(`Unexpected argument ${parsed.rest[0]}`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

run(videoMode);
