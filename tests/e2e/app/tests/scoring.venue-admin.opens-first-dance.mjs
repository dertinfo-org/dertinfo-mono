/**
 * Venue administrator opens the first dance that is still awaiting scores.
 */
export const id = 'scoring.venue-admin.opens-first-dance';

export async function run(ctx) {
  await ctx.venue.open();
  await ctx.venue.openFirst();
  await ctx.dances.ensureOpen();
  ctx.teamName = await ctx.dances.openFirstExpected();
  await ctx.danceDetail.waitForTeam(ctx.teamName);
}
