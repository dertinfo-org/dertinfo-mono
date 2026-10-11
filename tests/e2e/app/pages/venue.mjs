/** Venue list reached from the app menu. */
import { openMenuItem } from './menu.mjs';

export class VenuePage {
  constructor(page) {
    this.page = page;
  }

  async open() {
    await openMenuItem(this.page, 'Venue');
    await this.page.getByText('Your Venues').waitFor({ state: 'visible', timeout: 30000 });
  }

  async openFirst() {
    const venueList = this.page.locator('ion-list').filter({ hasText: 'Your Venues' });
    const venue = venueList.locator('ion-item').first();
    if (await venue.count() === 0) throw new Error('No venue was listed for the venue administrator');
    await venue.click();
  }
}
