/**
 * Refresh trap — direct visit to /session/warmup
 *
 * What it does:
 *   Sets sessionwarm=true (as if a previous warmup kick succeeded), then
 *   navigates directly to /session/warmup — simulating a browser refresh or
 *   bookmark while stuck on the warmup page.
 *
 * Why it's useful:
 *   WarmupComponent has no ngOnInit logic: it never calls giveItAKick() and
 *   never redirects when the API is already warm. This test proves that route
 *   is a permanent dead end unless the user clicks "Back to home" manually.
 *   Any fix should include recovery behaviour on this component.
 *
 * Expected output:
 *   - Final URL stays /session/warmup
 *   - Body still shows "Warming up"
 *   - No "Warmup kick" console logs (giveItAKick never runs)
 *
 * Run: npm run test:login:warmup  (from tests/e2e)
 */
import { chromium } from 'playwright';
import { WEB_BASE, seedFakeSession } from '../../shared-tools/session.mjs';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const logs = [];
page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));

await seedFakeSession(page, { sessionWarm: true });

console.log('Direct navigate to /session/warmup (refresh scenario)...');
await page.goto(`${WEB_BASE}/session/warmup`, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(3000);

console.log('Final URL:', page.url());
console.log('Body:', (await page.locator('body').innerText()).slice(0, 200).replace(/\s+/g, ' '));
console.log('Warmup logs:', logs.filter(l => /warmup|kick/i.test(l)));

await browser.close();
