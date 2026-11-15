/**
 * Group member sees the groups they already belong to.
 */
import { signInGroupMember } from '../pages/session.mjs';

export const id = 'groups.group-member.sees-current-group';

export async function run(ctx) {
  await signInGroupMember(ctx);
  await ctx.profile.open();
  await ctx.profile.expectGroups([ctx.membership.currentGroup]);
}
