import { withPersonaPage } from '../utils/helpers.mjs';
import { part } from '../utils/log.mjs';
import { RegistrationPage } from '../pages/registration.mjs';

export const id = 'registration.groupadmin.registerforevent-scenario1';

export async function run(ctx) {
  await withPersonaPage('group-admin', async (page) => {
    const registration = new RegistrationPage(page);
    await part(id, 'available event', () => registration.seeAvailableEvent(ctx));
    await part(id, 'open registration', () => registration.openRegistration(ctx));
    await part(id, 'add member', () => registration.addMember(ctx));
    await part(id, 'add guest', () => registration.addGuest(ctx));
    await part(id, 'add team', () => registration.addTeam(ctx));
    await part(id, 'assign activities', () => registration.assignActivities(ctx));
    await part(id, 'edit pending', () => registration.editPending(ctx));
    await part(id, 'submit', () => registration.submit(ctx));
  });
}
