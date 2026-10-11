import { withPersonaPage } from '../utils/helpers.mjs';
import { part } from '../utils/log.mjs';
import { RegistrationPage } from '../pages/registration.mjs';

export const id = 'registration.groupadmin.amends-submitted';

export async function run(ctx) {
  await withPersonaPage('group-admin', async (page) => {
    const registration = new RegistrationPage(page);
    await part(id, 'amend submitted', () => registration.amendSubmitted(ctx));
  });
}
