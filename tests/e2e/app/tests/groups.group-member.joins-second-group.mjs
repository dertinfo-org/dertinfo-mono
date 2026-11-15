/**
 * Group member joins a second group with its pin.
 * Issue 149: the new group is checked after signing out and back in.
 * https://github.com/dertinfo-org/dertinfo-mono/issues/149
 */
import { signOutAndBackIn } from '../pages/session.mjs';

export const id = 'groups.group-member.joins-second-group';

export async function run(ctx) {
  await ctx.profile.enterPin(ctx.membership.otherPin);
  await ctx.profile.waitForToast('Permission Added');
  await signOutAndBackIn(ctx);
  await ctx.profile.open();
  await ctx.profile.expectGroups([ctx.membership.currentGroup, ctx.membership.otherGroup]);
}
