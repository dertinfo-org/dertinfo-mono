/** Shared helpers for login-related Playwright scripts (fake Auth0 session seeding). */

export const WEB_BASE = 'http://localhost:44200';
export const API_BASE = 'http://localhost:44100/api';

/**
 * Seeds localStorage so AuthGuard treats the user as logged in.
 * @param {import('playwright').Page} page
 * @param {{ sessionWarm?: boolean | null }} options — true/false to set sessionwarm; omit to leave unchanged
 */
export async function seedFakeSession(page, { sessionWarm = false } = {}) {
  await page.goto(`${WEB_BASE}/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.evaluate((warm) => {
    const expiresAt = JSON.stringify(Date.now() + 3600000);
    localStorage.setItem('access_token', 'fake-token');
    localStorage.setItem('id_token', 'fake-id');
    localStorage.setItem('expires_at', expiresAt);
    localStorage.setItem('user_data', JSON.stringify({
      email: 'test@test.com',
      name: 'Test User',
      firstname: 'Test',
      lastname: 'User',
      gdprConsentGained: true
    }));
    if (warm === true) {
      sessionStorage.setItem('sessionwarm', JSON.stringify(true));
    } else if (warm === false) {
      sessionStorage.removeItem('sessionwarm');
    }
  }, sessionWarm);
}
