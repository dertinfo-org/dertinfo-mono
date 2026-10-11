import { API_BASE, withSmokePage } from '../utils/helpers.mjs';
import { SignInPage } from '../pages/sign-in.mjs';

export const id = 'auth.session-continuity.rejected-cache-returns-to-sign-in';

export async function run() {
  const configResponse = await fetch(`${API_BASE}/clientconfiguration/web`);
  if (!configResponse.ok) throw new Error(`Client configuration failed: HTTP ${configResponse.status}`);
  const config = await configResponse.json();
  if (!config.auth0ClientId || !config.auth0Audience || !config.auth0TenantDomain) {
    throw new Error('Client configuration is missing Auth0 client id, audience, or domain.');
  }

  await withSmokePage(async (page) => {
    const signIn = new SignInPage(page);
    await signIn.openWithRejectedCache(config);
    await signIn.expectReturnedToSignIn();
  }, { cookies: true });
}
