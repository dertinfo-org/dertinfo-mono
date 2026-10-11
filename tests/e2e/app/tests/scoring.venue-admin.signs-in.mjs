/**
 * Venue administrator signs in on the app.
 */
import { venueAdminCredentials } from '../../shared-tools/logins.mjs';

export const id = 'scoring.venue-admin.signs-in';

export async function run(ctx) {
  const { email, password } = venueAdminCredentials();
  await ctx.home.open();
  await ctx.home.signOutIfSignedIn();
  await ctx.home.clickLogIn();
  await ctx.auth0Login.signIn(email, password);
  await ctx.home.waitUntilSignedIn();
}
