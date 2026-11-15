/**
 * Group member sees a dance for each group they have joined.
 * Issue 149: both dances are checked after signing out and back in.
 * https://github.com/dertinfo-org/dertinfo-mono/issues/149
 */
import { signOutAndBackIn } from '../pages/session.mjs';

export const id = 'results.group-member.sees-joined-groups-dances';

export async function run(ctx) {
  await ctx.profile.open();
  await ctx.profile.enterPin(ctx.membership.otherPin);
  await ctx.profile.waitForToast('Permission Added');
  await signOutAndBackIn(ctx);
  await ctx.dances.open();
  await ctx.dances.expectTeams([ctx.membership.currentTeam, ctx.membership.otherTeam]);
}
