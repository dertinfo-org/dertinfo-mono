/**
 * Group member rejects an unknown pin.
 */
export const id = 'groups.group-member.rejects-unknown-pin';

export async function run(ctx) {
  await ctx.profile.enterPin(ctx.membership.unknownPin);
  await ctx.profile.waitForToast('Pin incorrect');
  await ctx.profile.expectGroups([ctx.membership.currentGroup]);
}
