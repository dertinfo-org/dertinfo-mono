import { withSmokePage } from '../utils/helpers.mjs';
import { CookieConsentPage } from '../pages/cookie-consent.mjs';

export const id = 'public.cookie-consent.visitor-accepts';

export async function run() {
  await withSmokePage(async (page) => {
    const cookies = new CookieConsentPage(page);
    await cookies.accept();
  }, { label: 'cookie-consent' });
}
