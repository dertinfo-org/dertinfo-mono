import { WEB_BASE, acceptCookieConsentIfVisible, saveCookieConsent, withSmokePage } from '../helpers.mjs';

export const id = 'public.cookie-consent.visitor-accepts';

export async function run() {
  await withSmokePage(async (page) => {
    await page.goto(WEB_BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const accepted = await acceptCookieConsentIfVisible(page, { timeoutMs: 15000 });
    const cookies = await page.context().cookies();
    const consent = cookies.find((cookie) => cookie.name === 'cookie-consent' && cookie.value === 'consented');
    if (accepted && !consent) throw new Error('Accept Cookies did not store cookie-consent');
    if (!accepted && !consent) throw new Error('Cookie consent was not shown and has not been accepted');
    if (consent.path !== '/') throw new Error(`cookie-consent path is ${consent.path}`);
    if (!(consent.expires > 0)) throw new Error('cookie-consent is a session cookie');
    await saveCookieConsent(page.context());
  }, { label: 'cookie-consent' });
}
