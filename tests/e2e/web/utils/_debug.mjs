import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const lines = [];
page.on('request', (req) => {
  const url = req.url();
  if (!url.includes('localhost')) {
    return;
  }
  if (url.match(/\.(js|css|png|jpg|svg|woff2?)(\?|$)/)) {
    return;
  }
  lines.push(`req ${url.split('?')[0]}`);
});
page.on('response', (res) => {
  const url = res.url();
  if (url.includes('44100')) {
    lines.push(`${res.status()} ${url.split('?')[0]}`);
  }
});
page.on('console', (msg) => {
  if (msg.type() === 'error') {
    lines.push(`console ${msg.text().slice(0, 180)}`);
  }
});
const routes = ['/content/results', '/content/history', '/content/community', '/content/notations', '/dertofderts'];
for (const route of routes) {
  lines.length = 0;
  await page.goto(`http://localhost:44200${route}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(4000);
  const text = (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 280);
  console.log(`\nROUTE ${route}`);
  console.log(`URL=${page.url()}`);
  console.log(`TEXT=${text}`);
  console.log(lines.filter((line) => line.startsWith('req') || line.startsWith('2') || line.startsWith('4') || line.startsWith('5') || line.startsWith('console')).join('\n'));
}
await browser.close();
process.exit(0);
await page.goto('http://localhost:44200/content/results', { waitUntil: 'domcontentloaded', timeout: 60000 });
const accept = page.getByRole('button', { name: 'Accept Cookies' });
if (await accept.isVisible().catch(() => false)) {
  await accept.click();
}
await page.waitForTimeout(12000);
console.log(`URL=${page.url()}`);
console.log(`resultsCmp=${await page.locator('app-public-results').count()}`);
console.log(`selects=${await page.locator('mat-select').count()}`);
console.log(`byText=${await page.getByText('Select Competition').count()}`);
const text = (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 500);
console.log(`TEXT=${text}`);
console.log('---net---');
console.log(lines.join('\n') || '(none)');
await browser.close();
