/**
 * Group member sees only their own team's dance.
 */
import { signInGroupMember } from '../pages/session.mjs';

export const id = 'results.group-member.sees-own-team-dance';

export async function run(ctx) {
  await signInGroupMember(ctx);
  await ctx.dances.open();
  await ctx.dances.expectTeams([ctx.membership.currentTeam]);
}
