/** Dance list for the selected venue: expected and completed dances. */
import { openMenuItem } from './menu.mjs';

export class DancesPage {
  constructor(page) {
    this.page = page;
  }

  expectedList() {
    return this.page.locator('ion-list').filter({ has: this.page.getByText('Expected Dances', { exact: true }) });
  }

  completedList() {
    return this.page.locator('ion-list').filter({ has: this.page.getByText('Completed Dances', { exact: true }) });
  }

  async open() {
    await openMenuItem(this.page, 'Dances');
    await this.page.getByText('Expected Dances').waitFor({ state: 'visible', timeout: 30000 });
  }

  /** The venue item sometimes lands directly on this list. Otherwise open it from the menu. */
  async ensureOpen() {
    const expectedHeading = this.page.getByText('Expected Dances');
    try {
      await expectedHeading.waitFor({ state: 'visible', timeout: 3000 });
    } catch {
      await this.open();
    }
  }

  async openFirstExpected() {
    const firstDance = this.expectedList().locator('ion-item').first();
    if (await firstDance.count() === 0) {
      throw new Error('No dance is awaiting scores. Apply system-basic, or use a database that still has an expected dance.');
    }
    const teamName = (await firstDance.locator('h2').innerText()).trim();
    await firstDance.click();
    return teamName;
  }

  async completedDance(teamName) {
    const completedDance = this.completedList().locator('ion-item').filter({ hasText: teamName });
    await completedDance.waitFor({ state: 'visible', timeout: 30000 });
    return completedDance;
  }
}
