/**
 * Venue administrator checks the dance has moved to Completed Dances.
 */
export const id = 'scoring.venue-admin.confirms-dance-completed';

export async function run(ctx) {
  await ctx.dances.open();
  const completedDance = await ctx.dances.completedDance(ctx.teamName);
  const stillExpected = await ctx.dances.expectedList().locator('ion-item').filter({ hasText: ctx.teamName }).count();
  if (stillExpected > 0) throw new Error(`${ctx.teamName} was still listed under Expected Dances`);
  await completedDance.click();
  await ctx.danceDetail.waitForTeam(ctx.teamName);
}
