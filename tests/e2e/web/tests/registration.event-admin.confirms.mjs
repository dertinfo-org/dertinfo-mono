import { withPersonaPage } from '../utils/helpers.mjs';
import { part } from '../utils/log.mjs';
import { RegistrationPage } from '../pages/registration.mjs';

export const id = 'registration.event-admin.confirms';

export async function run(ctx) {
  await withPersonaPage('event-admin', async (page) => {
    const registration = new RegistrationPage(page);
    await part(id, 'confirm', () => registration.confirm(ctx));
  });
  await withPersonaPage('group-admin', async (page) => {
    const registration = new RegistrationPage(page);
    await part(id, 'confirmed for group', () => registration.seeConfirmed(ctx));
  });
}
