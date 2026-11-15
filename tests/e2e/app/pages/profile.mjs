/** Profile: the signed-in person's groups, and the group member pin. */
import { openMenuItem } from './menu.mjs';

export class ProfilePage {
  constructor(page) {
    this.page = page;
  }

  group(name) {
    return this.page.locator(`[data-testid="profile-group"][data-group-name="${name}"]`);
  }

  async open() {
    await openMenuItem(this.page, 'Profile');
    await this.page.locator('[data-testid="profile-enter-pin"]').waitFor({ state: 'visible', timeout: 30000 });
  }

  async expectGroups(names) {
    await this.group(names[0]).waitFor({ state: 'visible', timeout: 30000 });
    const listed = this.page.locator('[data-testid="profile-group"]');
    const count = await listed.count();
    if (count !== names.length) {
      const actual = [];
      for (let index = 0; index < count; index += 1) {
        actual.push(await listed.nth(index).getAttribute('data-group-name'));
      }
      throw new Error(`Profile groups were [${actual.join(', ')}]. Expected [${names.join(', ')}].`);
    }
    for (const name of names) {
      await this.group(name).waitFor({ state: 'visible', timeout: 5000 });
    }
  }

  async enterPin(pin) {
    await this.page.locator('[data-testid="profile-enter-pin"]').click();
    const alert = this.page.locator('ion-alert.group-member-pin');
    await alert.waitFor({ state: 'visible', timeout: 10000 });
    await alert.locator('input').fill(pin);
    await alert.getByRole('button', { name: 'Save' }).click();
  }

  async waitForToast(message) {
    const toast = this.page.getByText(message, { exact: true });
    await toast.waitFor({ state: 'visible', timeout: 10000 });
    await toast.waitFor({ state: 'hidden', timeout: 10000 });
  }
}
