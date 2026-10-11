import { withPersonaPage } from '../utils/helpers.mjs';
import { part } from '../utils/log.mjs';
import { InvoicesPage } from '../pages/invoices.mjs';

export const id = 'invoicing.event-admin.reviews';

export async function run(ctx) {
  await withPersonaPage('event-admin', async (page) => {
    const invoices = new InvoicesPage(page);
    await part(id, 'event invoice', () => invoices.reviewEvent(ctx));
  });
}
