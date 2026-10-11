import { withPersonaPage } from '../utils/helpers.mjs';
import { part } from '../utils/log.mjs';
import { InvoicesPage } from '../pages/invoices.mjs';
import { RegistrationPage } from '../pages/registration.mjs';

export const id = 'registration.groupadmin.checkregistrationandedit-scenario1';

export async function run(ctx) {
  await withPersonaPage('group-admin', async (page) => {
    const registration = new RegistrationPage(page);
    await part(id, 'amend submitted', () => registration.amendSubmitted(ctx));
  });
  await withPersonaPage('event-admin', async (page) => {
    const registration = new RegistrationPage(page);
    await part(id, 'confirm', () => registration.confirm(ctx));
  });
  await withPersonaPage('group-admin', async (page) => {
    const registration = new RegistrationPage(page);
    await part(id, 'confirmed for group', () => registration.seeConfirmed(ctx));
  });
  await withPersonaPage('event-admin', async (page) => {
    const invoices = new InvoicesPage(page);
    await part(id, 'event invoice', () => invoices.reviewEvent(ctx));
  });
  await withPersonaPage('group-admin', async (page) => {
    const invoices = new InvoicesPage(page);
    await part(id, 'group invoice', () => invoices.reviewGroup(ctx));
  });
}
