/**
 * URL timeline — how the address bar changes during warmup
 *
 * What it does:
 *   Clears sessionwarm, navigates to /dashboard, and polls the browser URL
 *   every 100ms plus on each frame navigation event. Prints the deduplicated
 *   sequence of URLs seen during the flow.
 *
 * Why it's useful:
 *   WarmupResolver uses skipLocationChange:true when routing to /session/warmup,
 *   so the address bar may not always match what the user sees on screen. This
 *   test reveals whether the URL shows /dashboard, /session/warmup, or / during
 *   different phases — helping distinguish a router race from a simple auth failure.
 *
 * Expected output (fake token):
 *   - URL visits /dashboard briefly, then may end on / (home) after 401s
 *   - sessionwarm: true, "Warmup kick succeeded" in console
 *
 * Run: npm run test:login:warmup:url-history  (from tests/e2e)
 */
import { chromium } from 'playwright';
import { WEB_BASE, seedFakeSession } from '../../shared-tools/session.mjs';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const logs = [];
const urlHistory = [];
page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
page.on('framenavigated', () => urlHistory.push(page.url()));

await seedFakeSession(page, { sessionWarm: false });

const poll = setInterval(() => urlHistory.push(`[poll] ${page.url()}`), 100);

console.log('Going to /dashboard...');
await page.goto(`${WEB_BASE}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
await page.waitForTimeout(8000);
clearInterval(poll);

console.log('URL history:', [...new Set(urlHistory)]);
console.log('Final:', page.url());
console.log('sessionwarm:', await page.evaluate(() => sessionStorage.getItem('sessionwarm')));
console.log('Kick logs:', logs.filter(l => /kick|Warmup/i.test(l)));

await browser.close();
