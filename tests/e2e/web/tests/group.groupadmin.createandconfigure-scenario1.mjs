import { refreshPersonaSession, withPersonaPage } from '../utils/helpers.mjs';
import { part } from '../utils/log.mjs';
import { DashboardPage } from '../pages/dashboard.mjs';
import { GroupPage } from '../pages/group.mjs';

export const id = 'group.groupadmin.createandconfigure-scenario1';

export async function run(ctx) {
  await part(id, 'sign in', async () => {
    ctx.provide('session:group-admin', await refreshPersonaSession('group-admin'));
  });
  await withPersonaPage('group-admin', async (page) => {
    const dashboard = new DashboardPage(page);
    const group = new GroupPage(page);
    await part(id, 'create', () => dashboard.createGroup(ctx));
    await part(id, 'unconfigured', () => dashboard.openUnconfiguredGroup(ctx));
    await part(id, 'configure', () => group.configure(ctx));
    await part(id, 'default team', () => group.seeDefaultTeam(ctx));
    await part(id, 'add member', () => group.addMember(ctx));
    await part(id, 'add guest', () => group.addGuest(ctx));
    await part(id, 'add team', () => group.addTeam(ctx));
    await part(id, 'change image', () => group.changeImage(ctx));
  });
  await refreshPersonaSession('group-admin');
}
