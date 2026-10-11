/** Event and group invoice listings. */
import { team } from '../../shared-tools/loadData.js';
import { normalizeToken } from '../utils/helpers.mjs';
import { bodyText, eventAdminUrl, groupAdminUrl } from './controls.mjs';

export class InvoicesPage {
  constructor(page) {
    this.page = page;
  }

  async reviewEvent(ctx) {
    const eventId = ctx.chain[normalizeToken('configuredEventId')];
    await this.page.goto(eventAdminUrl(eventId, 'invoices'), { waitUntil: 'domcontentloaded', timeout: 60000 });
    await this.page.locator('app-addition-header').filter({ hasText: 'Invoices & Payments' }).waitFor({ state: 'visible', timeout: 30000 });
    await this.page.getByText('Registration Total').waitFor({ state: 'visible', timeout: 30000 });
    const listing = await bodyText(this.page);
    if (!listing.includes('Registration Total') || !listing.includes('Invoice Total')) {
      throw new Error('Invoice is missing the registration total or the invoice total');
    }
    if (!listing.includes('Not yet received')) {
      throw new Error('Invoice is not marked Not yet received');
    }
    await this.page.locator('mat-list-item', { hasText: 'Registration Total' }).first().click();
    await this.page.getByText('on behalf of').waitFor({ state: 'visible', timeout: 30000 });
    const detail = await bodyText(this.page);
    if (!detail.includes(team().TeamName)) {
      throw new Error('Invoice does not show the team');
    }
  }

  async reviewGroup(ctx) {
    const groupId = ctx.chain[normalizeToken('configuredGroupId')];
    await this.page.goto(groupAdminUrl(groupId, 'invoices'), { waitUntil: 'domcontentloaded', timeout: 60000 });
    await this.page.locator('app-addition-header').filter({ hasText: 'Invoices & Payments' }).waitFor({ state: 'visible', timeout: 30000 });
    await this.page.getByText('Not yet received').waitFor({ state: 'visible', timeout: 30000 });
    const listing = await bodyText(this.page);
    if (!listing.includes('Not yet received')) {
      throw new Error('Group invoice is not marked Not yet received');
    }
  }
}
