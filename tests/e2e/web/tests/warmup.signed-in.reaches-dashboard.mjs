/**
 * Delayed status + happy path — race fix control case
 *
 * What it does:
 *   Same 2-second delay on /api/status as warmup.signed-in.sticks-on-slow-status.mjs, but mocks all
 *   dashboard resolver APIs (/api/group, /api/event/web, /api/notification/check)
 *   to return 200 with empty JSON. Then navigates to /dashboard.
 *
 * Why it's useful:
 *   Proves the race condition alone is not fatal when the second navigation
 *   succeeds. If this test passes (reaches /dashboard, no "Warming up") but
 *   warmup.signed-in.sticks-on-slow-status.mjs fails, the root cause is failed dashboard resolvers
 *   (auth/config), not the warmup timing. Use as a control when validating fixes.
 *
 * Expected output:
 *   - Final URL: /dashboard
 *   - Warming up: false
 *   - Dashboard-ish content visible
 *
 * Run: npm run test:login:warmup  (from tests/e2e)
 */
import { chromium } from 'playwright';
import { WEB_BASE, seedFakeSession } from '../../shared-tools/session.mjs';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.route('**/api/status', async route => {
  await new Promise(r => setTimeout(r, 2000));
  await route.continue();
});
await page.route('**/api/group', route => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
await page.route('**/api/event/web', route => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
await page.route('**/api/notification/check', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));

await seedFakeSession(page, { sessionWarm: false });

await page.goto(`${WEB_BASE}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(8000);

const text = await page.locator('body').innerText();
console.log('Final URL:', page.url());
console.log('Warming up:', text.includes('Warming up'));
console.log('Dashboard-ish:', text.includes('Dashboard') || text.includes('DASHBOARD'));

await browser.close();
