/** Home page at /home, including the header sign-in control. */
export const APP_BASE = 'http://localhost:44300';

export class HomePage {
  constructor(page) {
    this.page = page;
  }

  loginButton() {
    return this.page.getByRole('button', { name: /log in/i });
  }

  logoutButton() {
    return this.page.getByRole('button', { name: /log out/i });
  }

  async open() {
    await this.page.goto(`${APP_BASE}/home`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await this.loginButton().or(this.logoutButton()).waitFor({ state: 'visible', timeout: 30000 });
  }

  async signOutIfSignedIn() {
    const logout = this.logoutButton();
    if (await logout.isVisible()) {
      await logout.click();
      await this.loginButton().waitFor({ state: 'visible', timeout: 20000 });
    }
  }

  async clickLogIn() {
    await this.loginButton().click();
  }

  async waitUntilSignedIn() {
    await this.logoutButton().waitFor({ state: 'visible', timeout: 90000 });
  }
}
