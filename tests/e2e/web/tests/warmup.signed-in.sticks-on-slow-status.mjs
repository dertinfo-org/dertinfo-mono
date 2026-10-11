/**
 * Mid-warmup snapshot — race condition reproducer
 *
 * What it does:
 *   Adds a 2-second artificial delay to GET /api/status, navigates to /dashboard,
 *   then snapshots the page at 500ms (mid-warmup) and again after 5s (complete).
 *   Reports URL, whether "Warming up" is visible, and sessionwarm flag.
 *
 * Why it's useful:
 *   This is the key test that exposes the router race. When /api/status is slow,
 *   the navigation to /session/warmup can finish before giveItAKick() calls
 *   navigateByUrl('/dashboard'). If the follow-up navigation then fails (e.g. 401),
 *   the user is left on /session/warmup with sessionwarm=true — exactly the bug
 *   reported in production. Compare with warmup.signed-in.reaches-dashboard.mjs where mocks return 200.
 *
 * Expected output (fake token, delayed status):
 *   - Mid-warmup: URL may still be /dashboard, warmup UI not yet visible
 *   - After complete: URL=/session/warmup, "Warming up"=true, sessionwarm=true
 *
 * Run: npm run test:login:warmup:mid-race  (from tests/e2e)
 */
import { chromium } from 'playwright';
import { WEB_BASE, seedFakeSession } from '../../shared-tools/session.mjs';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await seedFakeSession(page, { sessionWarm: false });

await page.route('**/api/status', async route => {
  await new Promise(r => setTimeout(r, 2000));
  await route.continue();
});

page.goto(`${WEB_BASE}/dashboard`, { waitUntil: 'commit' });

await page.waitForTimeout(500);
const midUrl = page.url();
const midText = await page.locator('body').innerText().catch(() => '');
console.log('During warmup (500ms):');
console.log('  URL:', midUrl);
console.log('  Shows Warming up:', midText.includes('Warming up'));

await page.waitForTimeout(5000);
console.log('After complete:');
console.log('  URL:', page.url());
console.log('  Shows Warming up:', (await page.locator('body').innerText()).includes('Warming up'));
console.log('  sessionwarm:', await page.evaluate(() => sessionStorage.getItem('sessionwarm')));

await browser.close();
