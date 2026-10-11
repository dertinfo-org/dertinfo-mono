/**
 * Resolver hang vs auth failure — three scenarios in one run
 *
 * What it does:
 *   Runs three sub-scenarios, each with a 2s delay on /api/status:
 *
 *   1. all-401    — no mocks; real API returns 401 for dashboard calls
 *   2. group-hang — /api/group never responds; other dashboard APIs return 200
 *   3. notif-hang — /api/notification/check never responds; group/event return 200
 *
 *   Prints final URL and whether "Warming up" is still visible for each.
 *
 * Why it's useful:
 *   Distinguishes two different "stuck" presentations:
 *   - Auth failure (all-401): URL ends on /session/warmup — matches user report
 *   - Hung resolver (group-hang, notif-hang): URL may be /dashboard but warmup
 *     UI still shows because Angular never finished activating the route
 *   Helps decide whether to fix Auth0 config, add resolver timeouts, or both.
 *
 * Expected output (fake token):
 *   - all-401:    URL=/session/warmup, warmup=true
 *   - group-hang: URL=/dashboard,   warmup=true (UI stuck, URL looks correct)
 *   - notif-hang: URL=/dashboard,   warmup=true (same)
 *
 * Run: npm run test:login:warmup:hang-vs-auth  (from tests/e2e)
 */
import { chromium } from 'playwright';
import { WEB_BASE, seedFakeSession } from '../../shared-tools/session.mjs';

async function run(label, routes) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.route('**/api/status', async route => {
    await new Promise(r => setTimeout(r, 2000));
    await route.continue();
  });

  for (const [pattern, handler] of routes) {
    await page.route(pattern, handler);
  }

  await seedFakeSession(page, { sessionWarm: false });

  await page.goto(`${WEB_BASE}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(6000);

  const text = await page.locator('body').innerText();
  console.log(`[${label}] URL=${page.url()} warmup=${text.includes('Warming up')}`);
  await browser.close();
}

const ok = { status: 200, contentType: 'application/json', body: '[]' };
const okNotif = { status: 200, contentType: 'application/json', body: '{}' };
const hang = async () => { /* never respond */ };

await run('all-401', []);
await run('group-hang', [
  ['**/api/group', hang],
  ['**/api/event/web', r => r.fulfill(ok)],
  ['**/api/notification/check', r => r.fulfill(okNotif)],
]);
await run('notif-hang', [
  ['**/api/group', r => r.fulfill(ok)],
  ['**/api/event/web', r => r.fulfill(ok)],
  ['**/api/notification/check', hang],
]);
