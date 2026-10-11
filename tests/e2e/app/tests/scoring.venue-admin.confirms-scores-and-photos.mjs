/**
 * Venue administrator reopens the completed dance and checks the marks and photos.
 */
export const id = 'scoring.venue-admin.confirms-scores-and-photos';

export async function run(ctx) {
  await ctx.danceDetail.openScores();
  for (let index = 0; index < ctx.plan.length; index += 1) {
    const actual = await ctx.danceDetail.scoreValue(index);
    if (actual !== ctx.plan[index].value) {
      throw new Error(`${ctx.plan[index].label} was ${actual || 'empty'} after reopening, expected ${ctx.plan[index].value}`);
    }
  }
  await ctx.danceDetail.openPhotosTab();
  await ctx.danceDetail.waitForResizedSheets(2);
}
