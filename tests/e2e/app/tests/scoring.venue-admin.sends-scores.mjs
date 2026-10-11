/**
 * Venue administrator sends the valid marks for the open dance.
 */
export const id = 'scoring.venue-admin.sends-scores';

export async function run(ctx) {
  await ctx.danceDetail.sendScores();
  await ctx.danceDetail.ensurePhotoCapture();
}
