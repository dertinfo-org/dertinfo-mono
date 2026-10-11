/**
 * Shared checks for the website smoke suite.
 * The site must already be running. Persona passwords come from shared-data/logins.env.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import { personaCredentials } from '../../shared-tools/logins.mjs';
import { closeRecordedBrowser, contextOptions } from '../../shared-tools/recording.mjs';

export const WEB_BASE = 'http://localhost:44200';
export const API_BASE = 'http://localhost:44100/api';
export const VIEWPORT = { width: 1400, height: 900 };

/** Fixed viewport and locale so date entry does not follow the machine settings. */
export const SMOKE_CONTEXT = {
  viewport: VIEWPORT,
  locale: 'en-GB',
  timezoneId: 'Europe/London',
};

const webDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const runStateDir = path.join(webDir, 'fixtures', 'fixture-1', 'run-state');
const cookieConsentFile = path.join(runStateDir, 'sessions', 'cookie-consent.json');

export const EXIT = {
  ok: 0,
  fail: 1,
  challenged: 2,
  blocked: 3,
  noGroup: 4,
};

/** `createdEventId` is instance 1. `createdEventId[2]` stays as written. */
export function normalizeToken(name) {
  return /\[\d+\]$/.test(name) ? name : `${name}[1]`;
}

/** A requirement with no brackets is instance 1 of that scenario. */
export function normalizeRef(requirement) {
  const match = String(requirement).match(/^(.*)\[(\d+)\]$/);
  if (!match) return { id: requirement, instance: 1 };
  return { id: match[1], instance: Number(match[2]) };
}

export function isSessionError(url, bodyText) {
  const pathName = new URL(url).pathname;
  if (['/session/404', '/session/error', '/session/403', '/session/401'].includes(pathName)) {
    return true;
  }
  const text = bodyText || '';
  if (text.includes('Server Error!') || text.includes('Forbidden!')) {
    return true;
  }
  if (/^404\b/m.test(text) && text.includes('Not Found')) {
    return true;
  }
  return false;
}

export async function bodyText(page) {
  return page.locator('body').innerText();
}

/**
 * @param {import('playwright').Page} page
 * @param {string} routePath
 * @param {{ testId: string, timeoutMs?: number }} expect
 */
/** Accept the cookie banner when it is on screen. A page that has already accepted cookies skips this. */
export async function acceptCookieConsentIfVisible(page, { timeoutMs = 0 } = {}) {
  const modal = page.getByTestId('cookie-consent');
  const visible = timeoutMs > 0
    ? await modal.waitFor({ state: 'visible', timeout: timeoutMs }).then(() => true).catch(() => false)
    : await modal.isVisible().catch(() => false);
  if (!visible) return false;
  await modal.getByRole('button', { name: 'Accept Cookies', exact: true }).click();
  await modal.waitFor({ state: 'hidden', timeout: 15000 });
  return true;
}

export async function openContent(page, routePath, expect) {
  const errors = [];
  const onError = (error) => errors.push(error.message);
  page.on('pageerror', onError);
  try {
    await page.goto(`${WEB_BASE}${routePath}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await acceptCookieConsentIfVisible(page);
    const timeoutMs = expect.timeoutMs ?? 30000;
    try {
      await page.getByTestId(expect.testId).waitFor({ state: 'visible', timeout: timeoutMs });
    } catch (error) {
      const url = page.url();
      const text = await bodyText(page).catch(() => '');
      if (isSessionError(url, text)) {
        throw new Error(`${routePath} rendered the session error page (${url})`);
      }
      if (await page.getByTestId('app-warming').isVisible().catch(() => false)) {
        throw new Error(`${routePath} was still warming up`);
      }
      throw error;
    }
    await acceptCookieConsentIfVisible(page);
    const url = page.url();
    const text = await bodyText(page);
    if (isSessionError(url, text)) {
      throw new Error(`${routePath} rendered the session error page (${url})`);
    }
    if (!text.trim()) {
      throw new Error(`${routePath} rendered an empty body`);
    }
    return errors;
  } finally {
    page.off('pageerror', onError);
  }
}

export function sessionFile(persona) {
  return path.join(runStateDir, 'sessions', `${persona}.json`);
}

export { personaCredentials };

async function loginWall(page) {
  const text = (await bodyText(page).catch(() => '')).toLowerCase();
  const captchaFrame = await page.locator('iframe[src*="recaptcha"], iframe[src*="hcaptcha"], iframe[title*="captcha" i]').count();
  if (
    captchaFrame > 0
    || text.includes('captcha')
    || text.includes("i'm not a robot")
    || text.includes('verify you are human')
  ) {
    return 'captcha';
  }
  if (
    text.includes('access denied')
    || text.includes('blocked')
    || text.includes('unusual activity')
    || text.includes('something went wrong')
  ) {
    return 'blocked';
  }
  return null;
}

async function completeUniversalLogin(page, email, password, headed) {
  await page.waitForURL((url) => !url.href.startsWith(WEB_BASE) || url.pathname.includes('/auth/signin'), { timeout: 30000 });
  const leftApp = Date.now() + 20000;
  while (Date.now() < leftApp && page.url().startsWith(WEB_BASE)) {
    await page.waitForTimeout(250);
  }
  if (page.url().startsWith(WEB_BASE)) {
    throw Object.assign(new Error('Sign-in did not leave the app for Auth0'), { code: EXIT.challenged });
  }
  const wall = await loginWall(page);
  if (wall) throw Object.assign(new Error(`Auth0 ${wall} the automated login`), { code: EXIT.blocked });

  const username = page.locator('input[name="username"], input[name="email"], input#username').first();
  await username.waitFor({ state: 'visible', timeout: 20000 });
  await username.fill(email);

  let passwordBox = page.locator('input[name="password"], input#password').first();
  if (!(await passwordBox.isVisible().catch(() => false))) {
    await page.locator('button[type="submit"], button[data-action-button-primary="true"], button[name="action"]').first().click();
    passwordBox = page.locator('input[name="password"], input#password').first();
    try {
      await passwordBox.waitFor({ state: 'visible', timeout: 15000 });
    } catch {
      const after = await loginWall(page);
      if (after) throw Object.assign(new Error(`Auth0 ${after} the automated login`), { code: EXIT.blocked });
      throw Object.assign(new Error('Auth0 did not show the password field'), { code: headed ? EXIT.blocked : EXIT.challenged });
    }
  }
  await passwordBox.fill(password);
  await page.locator('button[type="submit"], button[data-action-button-primary="true"], button[name="action"]').first().click();

  const consent = page.getByRole('button', { name: /accept|allow/i });
  const backHome = Date.now() + 90000;
  while (Date.now() < backHome) {
    const current = page.url();
    if (current.startsWith(`${WEB_BASE}/dashboard`)) return;
    const wallNow = await loginWall(page);
    if (wallNow && !current.startsWith(WEB_BASE)) {
      throw Object.assign(new Error(`Auth0 ${wallNow} the automated login`), { code: EXIT.blocked });
    }
    if (!current.startsWith(WEB_BASE) && await consent.isVisible().catch(() => false)) await consent.click();
    await page.waitForTimeout(500);
  }
  if (!headed && !page.url().startsWith(WEB_BASE)) {
    throw Object.assign(new Error('Headless login did not return to the app'), { code: EXIT.challenged });
  }
  throw new Error(`Login did not reach /dashboard (${page.url()})`);
}

async function waitForDashboard(page) {
  await acceptCookieConsentIfVisible(page);
  try {
    await page.getByTestId('app-ready').waitFor({ state: 'visible', timeout: 60000 });
  } catch (error) {
    const url = page.url();
    const text = await bodyText(page).catch(() => '');
    const warming = await page.getByTestId('app-warming').isVisible().catch(() => false);
    if (!url.startsWith(`${WEB_BASE}/dashboard`) || warming || isSessionError(url, text)) {
      throw new Error(`Dashboard was not the signed-in dashboard (${url})`);
    }
    throw error;
  }
  const url = page.url();
  const text = await bodyText(page);
  if (!url.startsWith(`${WEB_BASE}/dashboard`) || isSessionError(url, text)) {
    throw new Error(`Dashboard was not the signed-in dashboard (${url})`);
  }
}

async function persistSession(context, file) {
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    await context.storageState({ path: file });
  } catch {
    // A closed page has nothing left to save.
  }
}

/** Reuse the cookie stored by the visitor accept scenario. Later contexts do not click the banner. */
export async function applyCookieConsent(context) {
  if (!fs.existsSync(cookieConsentFile)) {
    throw new Error('Cookie consent has not been accepted');
  }
  const state = JSON.parse(fs.readFileSync(cookieConsentFile, 'utf8'));
  const cookies = (state.cookies || []).filter((cookie) => cookie.name === 'cookie-consent');
  if (cookies.length === 0) throw new Error('Saved cookie consent is missing the cookie-consent cookie');
  await context.addCookies(cookies);
}

export async function saveCookieConsent(context) {
  fs.mkdirSync(path.dirname(cookieConsentFile), { recursive: true });
  await context.storageState({ path: cookieConsentFile });
}

async function acceptGdpr(page) {
  const button = page.getByRole('button', { name: 'Accept Terms & Provide Consent' });
  if (await button.isVisible().catch(() => false)) await button.click();
}

async function openSmokePage({ headed = false, storageState, cookies = false } = {}) {
  const browser = await chromium.launch({ headless: !headed });
  const options = { ...SMOKE_CONTEXT };
  if (storageState) options.storageState = storageState;
  const context = await browser.newContext(contextOptions(options));
  if (cookies) await applyCookieConsent(context);
  const page = await context.newPage();
  return { browser, context, page };
}

async function closeSmokePage(browser, context, page, label, persistFile) {
  if (persistFile) await persistSession(context, persistFile);
  await closeRecordedBrowser(browser, page, label);
}

/** Open a page and close it when `run` finishes. Records video when the suite asked for it. */
export async function withSmokePage(run, { headed = false, storageState, cookies = false, persistFile = null, label = 'page' } = {}) {
  const { browser, context, page } = await openSmokePage({ headed, storageState, cookies });
  try {
    return await run(page);
  } finally {
    await closeSmokePage(browser, context, page, label, persistFile);
  }
}

async function dashboardLoads(storageState) {
  const { browser, context, page } = await openSmokePage({ storageState, cookies: true });
  try {
    await page.goto(`${WEB_BASE}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await waitForDashboard(page);
    return true;
  } catch {
    return false;
  } finally {
    await closeSmokePage(browser, context, page, 'session-check', storageState);
  }
}

async function performLogin(persona, email, password, headed) {
  const { browser, context, page } = await openSmokePage({ headed, cookies: true });
  try {
    await page.goto(`${WEB_BASE}/auth/signin`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await completeUniversalLogin(page, email, password, headed);
    await waitForDashboard(page);
    await acceptGdpr(page);
    const file = sessionFile(persona);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    await context.storageState({ path: file });
    return file;
  } finally {
    await closeSmokePage(browser, context, page, headed ? 'login-headed' : 'login');
  }
}

/** Sign in again and replace the saved session, so a new group or event id is on the token. */
export async function refreshPersonaSession(persona) {
  const { email, password } = personaCredentials(persona);
  try {
    return await performLogin(persona, email, password, false);
  } catch (error) {
    if (error.code !== EXIT.challenged) throw error;
    return await performLogin(persona, email, password, true);
  }
}

/** Reuse a saved session when the dashboard still loads. Otherwise sign in once. */
export async function ensurePersonaSession(persona) {
  const file = sessionFile(persona);
  if (fs.existsSync(file) && await dashboardLoads(file)) return file;
  const { email, password } = personaCredentials(persona);
  try {
    return await performLogin(persona, email, password, false);
  } catch (error) {
    if (error.code !== EXIT.challenged) throw error;
    return await performLogin(persona, email, password, true);
  }
}

/** Open a fresh browser signed in as persona, then close it when `run` finishes. */
export async function withPersonaPage(persona, run) {
  const file = sessionFile(persona);
  return withSmokePage(run, { storageState: file, cookies: true, persistFile: file, label: 'page' });
}

/** Wait until the signed-in dashboard has rendered the add button. */
export async function waitForDashboardFab(page) {
  await acceptCookieConsentIfVisible(page);
  try {
    await page.getByTestId('dashboard-add').waitFor({ state: 'visible', timeout: 60000 });
  } catch {
    const text = await bodyText(page).catch(() => '');
    throw new Error(`Dashboard add button was not available (${page.url()}): ${text.replace(/\s+/g, ' ').slice(0, 240)}`);
  }
  const url = page.url();
  const text = await bodyText(page);
  if (!url.startsWith(`${WEB_BASE}/dashboard`) || isSessionError(url, text)) {
    throw new Error(`Dashboard add button was not available (${url}): ${text.replace(/\s+/g, ' ').slice(0, 240)}`);
  }
}

/** Open the dashboard add menu and choose the flyout item with this action name. */
export async function openFabItem(page, action) {
  await waitForDashboardFab(page);
  await page.getByTestId('dashboard-add').click();
  await page.getByTestId(`fab-${action}`).click();
}
