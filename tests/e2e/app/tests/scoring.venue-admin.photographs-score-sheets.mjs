/**
 * Venue administrator takes two marking-sheet photos.
 */
export const id = 'scoring.venue-admin.photographs-score-sheets';

export async function run(ctx) {
  await ctx.camera.capture();
  await ctx.danceDetail.waitForResizedSheets(1);
  await ctx.camera.capture();
  await ctx.danceDetail.waitForResizedSheets(2);
}
