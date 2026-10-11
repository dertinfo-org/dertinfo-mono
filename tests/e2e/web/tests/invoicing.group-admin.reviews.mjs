import { withPersonaPage } from '../utils/helpers.mjs';
import { part } from '../utils/log.mjs';
import { InvoicesPage } from '../pages/invoices.mjs';

export const id = 'invoicing.group-admin.reviews';

export async function run(ctx) {
  await withPersonaPage('group-admin', async (page) => {
    const invoices = new InvoicesPage(page);
    await part(id, 'group invoice', () => invoices.reviewGroup(ctx));
  });
}
