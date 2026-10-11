/**
 * Stale Auth0 cache on Warmup.
 *
 * Plants a browser cache the website treats as logged in, with a refresh token
 * Auth0 will reject. Does not type a password.
 *
 * Exit 0 only when the planted cache is gone and the browser has left
 * "Warming up" for the sign-in page. On today's Warmup code that exit is
 * expected to fail while the page is still warming up.
 *
 * Run: npm run test:login:warmup:stale-session  (from tests/e2e)
 * Requires the local website (:44200) and API (:44100).
 */
import { chromium } from 'playwright';
import { API_BASE, WEB_BASE } from '../../shared-tools/session.mjs';

const WAIT_MS = 15000;

function plantSession(config) {
  const scope = 'openid profile email offline_access';
  const base64Url = (value) => btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    sub: 'auth0|stale-session-test',
    email: 'stale-session@example.com',
    name: 'Stale Session',
    iss: `https://${config.auth0TenantDomain}/`,
    aud: config.auth0ClientId,
    iat: now - 3600,
    exp: now + 3600,
  };
  const idToken = `${base64Url({ alg: 'RS256', typ: 'JWT' })}.${base64Url(claims)}.c3RhbGU`;
  const decodedToken = {
    user: { sub: claims.sub, email: claims.email, name: claims.name },
    claims,
  };
  const userKey = `@@auth0spajs@@::${config.auth0ClientId}::@@user@@`;
  const tokenKey = `@@auth0spajs@@::${config.auth0ClientId}::${config.auth0Audience}::${scope}`;

  localStorage.setItem(userKey, JSON.stringify({ id_token: idToken, decodedToken }));
  localStorage.setItem(tokenKey, JSON.stringify({
    body: {
      client_id: config.auth0ClientId,
      access_token: 'stale-access-token',
      id_token: idToken,
      refresh_token: 'stale-refresh-token-not-valid',
      scope: scope,
      expires_in: 7200,
      token_type: 'Bearer',
      audience: config.auth0Audience,
      decodedToken,
    },
    expiresAt: now - 120,
  }));
  localStorage.setItem('user_data', JSON.stringify({
    email: claims.email,
    name: claims.name,
    firstname: 'Stale',
    lastname: 'Session',
    gdprConsentGained: true,
  }));
  localStorage.setItem('dertinfo_access_token', 'stale-access-token');
  sessionStorage.removeItem('sessionwarm');
  console.log(`planted ${Object.keys(localStorage).filter((key) => key.startsWith('@@auth0spajs@@')).length} auth0 keys on ${location.origin}`);
}

function isSignIn(url) {
  return url.includes('/authorize') || url.includes('/u/login') || url.includes('/auth/signin');
}

const configResponse = await fetch(`${API_BASE}/clientconfiguration/web`);
if (!configResponse.ok) {
  console.error(`Client configuration failed: HTTP ${configResponse.status}`);
  process.exit(1);
}
const config = await configResponse.json();
if (!config.auth0ClientId || !config.auth0Audience || !config.auth0TenantDomain) {
  console.error('Client configuration is missing Auth0 client id, audience, or domain.');
  process.exit(1);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const tokenCalls = [];
let sawPlanted = false;

page.on('request', (request) => {
  if (request.url().includes('/oauth/token')) {
    tokenCalls.push(request.url());
  }
});
page.on('console', (message) => {
  if (message.text().startsWith('planted ')) {
    sawPlanted = true;
  }
});
await page.addInitScript(plantSession, config);
await page.goto(`${WEB_BASE}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 60000 });

const deadline = Date.now() + WAIT_MS;
let url = page.url();
let warming = false;
while (Date.now() < deadline) {
  url = page.url();
  if (url.startsWith(WEB_BASE)) {
    warming = (await page.locator('body').innerText()).includes('Warming up');
  }
  if (!url.startsWith(WEB_BASE) && isSignIn(url)) {
    break;
  }
  await page.waitForTimeout(1000);
}

const storage = await page.context().storageState();
const origin = storage.origins.find((entry) => entry.origin === WEB_BASE);
const cacheKeys = (origin?.localStorage ?? [])
  .map((entry) => entry.name)
  .filter((key) => key.startsWith('@@auth0spajs@@') || key === 'user_data' || key === 'dertinfo_access_token');

await browser.close();

const recovered = sawPlanted
  && tokenCalls.length > 0
  && !url.startsWith(WEB_BASE)
  && isSignIn(url)
  && cacheKeys.length === 0
  && !warming;
console.log(`URL=${url}`);
console.log(`warming=${warming}`);
console.log(`cache=${cacheKeys.join(',') || '(empty)'}`);
console.log(`tokenRequests=${tokenCalls.length}`);
console.log(recovered ? 'PASS stale session cleared; browser is on sign-in' : 'FAIL stale session was not cleared onto sign-in');
if (!recovered && warming) {
  console.log('OBSERVED stuck on Warming up');
}
process.exit(recovered ? 0 : 1);
