/**
 * Baseline warmup flow — end-to-end smoke test
 *
 * What it does:
 *   Seeds a fake logged-in session (localStorage token + user data), clears
 *   sessionwarm, then navigates to /dashboard. Records every /api/* request,
 *   console messages, final URL, and whether sessionwarm was set.
 *
 * Why it's useful:
 *   This is the first test to run when investigating the warmup bug. It shows
 *   the full sequence: /api/status (warmup kick), then the dashboard resolvers
 *   (/api/group, /api/event/web, /api/notification/check). With a fake token
 *   those authenticated calls return 401, which mirrors what happens when Auth0
 *   is misconfigured — even though /api/status looks fine in the network tab.
 *
 * Expected output (fake token, no API mocks):
 *   - Console: "Warmup kick succeeded"
 *   - sessionwarm: true
 *   - Dashboard APIs: 401
 *   - User does NOT stay on /dashboard (navigation fails after warmup)
 *
 * Run: npm run test:login:warmup:baseline  (from tests/e2e)
 */
import { chromium } from 'playwright';
import { WEB_BASE, seedFakeSession } from '../../shared-tools/session.mjs';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const logs = [];
page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));

const requests = [];
page.on('request', req => {
  if (req.url().includes('/api/')) requests.push(`REQ ${req.method()} ${req.url()}`);
});
page.on('response', res => {
  if (res.url().includes('/api/')) requests.push(`RES ${res.status()} ${res.url()}`);
});

await seedFakeSession(page, { sessionWarm: false });

console.log('Navigating to /dashboard...');
await page.goto(`${WEB_BASE}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  .catch(e => console.log('goto timeout/err:', e.message));

await page.waitForTimeout(5000);

const url = page.url();
const title = await page.title();
const bodyText = await page.locator('body').innerText();
const sessionWarm = await page.evaluate(() => sessionStorage.getItem('sessionwarm'));

console.log('Final URL:', url);
console.log('Title:', title);
console.log('Session warm:', sessionWarm);
console.log('Body snippet:', bodyText.slice(0, 300).replace(/\s+/g, ' '));
console.log('API calls:');
requests.forEach(r => console.log(' ', r));
console.log('Console logs:');
logs.filter(l => /warmup|Warmup|kick|navigat|error/i.test(l)).forEach(l => console.log(' ', l));

await browser.close();
