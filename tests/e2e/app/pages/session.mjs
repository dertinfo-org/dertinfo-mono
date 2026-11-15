/**
 * Group member sign-in for the app fixtures.
 * Issue 149: a saved pin is not on the open sign-in. The tests sign out and
 * back in before they check the new group. Remove that step when the bug is fixed.
 * https://github.com/dertinfo-org/dertinfo-mono/issues/149
 */
import { personaCredentials } from '../../shared-tools/logins.mjs';

export const PIN_MEMBERSHIP_BUG = 'https://github.com/dertinfo-org/dertinfo-mono/issues/149';

async function acceptConsentIfShown(ctx) {
  const accept = ctx.page.getByRole('button', { name: 'Accept' });
  const signedIn = ctx.home.logoutButton();
  const winner = await Promise.race([
    accept.waitFor({ state: 'visible', timeout: 20000 }).then(() => 'accept'),
    signedIn.waitFor({ state: 'visible', timeout: 20000 }).then(() => 'signed-in'),
  ]);
  if (winner === 'accept') await accept.click();
}

export async function signInGroupMember(ctx) {
  const { email, password } = personaCredentials('group-member');
  await ctx.home.open();
  await ctx.home.signOutIfSignedIn();
  await ctx.home.clickLogIn();
  await ctx.auth0Login.signIn(email, password);
  await acceptConsentIfShown(ctx);
  await ctx.home.waitUntilSignedIn();
}

/** Sign out and back in so the token picked up at login includes a pin saved while signed in. */
export async function signOutAndBackIn(ctx) {
  const { email, password } = personaCredentials('group-member');
  await ctx.home.signOutIfSignedIn();
  await ctx.home.clickLogIn();
  await ctx.auth0Login.signIn(email, password);
  await acceptConsentIfShown(ctx);
  await ctx.home.waitUntilSignedIn();
}
