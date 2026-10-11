import { refreshPersonaSession, withPersonaPage } from '../utils/helpers.mjs';
import { part } from '../utils/log.mjs';
import { DashboardPage } from '../pages/dashboard.mjs';
import { EventPage } from '../pages/event.mjs';

export const id = 'event.eventadmin.createandconfigure-scenario1';

export async function run(ctx) {
  await part(id, 'sign in', async () => {
    ctx.provide('session:event-admin', await refreshPersonaSession('event-admin'));
  });
  await withPersonaPage('event-admin', async (page) => {
    const dashboard = new DashboardPage(page);
    const event = new EventPage(page);
    await part(id, 'create', () => dashboard.createEvent(ctx));
    await part(id, 'unconfigured', () => dashboard.openUnconfiguredEvent(ctx));
    await part(id, 'configure', () => event.configure(ctx));
    await part(id, 'add activities', () => event.addActivities(ctx));
  });
  await refreshPersonaSession('event-admin');
}
