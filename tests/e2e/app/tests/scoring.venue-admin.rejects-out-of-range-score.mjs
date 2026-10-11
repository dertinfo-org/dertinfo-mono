/**
 * Venue administrator enters a mark above the category maximum, then corrects it.
 */
export const id = 'scoring.venue-admin.rejects-out-of-range-score';

export async function run(ctx) {
  ctx.plan = await ctx.danceDetail.readScorePlan();
  await ctx.danceDetail.fillScores(ctx.plan);
  await ctx.danceDetail.fillScore(0, String(ctx.plan[0].max + 1));
  await ctx.danceDetail.waitForOutOfRange();
  if (!(await ctx.danceDetail.sendScoresDisabled())) {
    throw new Error('Send Scores stayed enabled for an out-of-range score');
  }
  await ctx.danceDetail.fillScore(0, ctx.plan[0].value);
  await ctx.danceDetail.waitForScoresValid();
  if (await ctx.danceDetail.sendScoresDisabled()) {
    throw new Error('Send Scores stayed disabled after the score was corrected');
  }
}
