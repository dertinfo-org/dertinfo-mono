/**
 * Unpublished results stay hidden.
 */
export const id = 'results.group-member.hides-unpublished-results';

export async function run(ctx) {
  await ctx.dances.openTeam(ctx.membership.currentTeam);
  await ctx.danceDetail.waitForTeam(ctx.membership.currentTeam);
  await ctx.danceDetail.assertResultsHidden();
}
