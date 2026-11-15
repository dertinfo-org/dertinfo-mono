/** Home page at /home, including the header sign-in control. */
export const APP_BASE = 'http://localhost:44300';

export class HomePage {
  constructor(page) {
    this.page = page;
  }

  loginButton() {
    return this.page.locator('[data-testid="app-header-login"]:visible').last();
  }

  logoutButton() {
    return this.page.locator('[data-testid="app-header-logout"]:visible').last();
  }

  async open() {
    // The dev server returns the app at /. A direct /home request is "Cannot GET /home".
    // Angular then redirects / to the home page.
    await this.page.goto(`${APP_BASE}/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await this.loginButton().or(this.logoutButton()).waitFor({ state: 'visible', timeout: 30000 });
  }

  async signOutIfSignedIn() {
    const logout = this.logoutButton();
    if (await logout.isVisible()) {
      await logout.click();
      await this.loginButton().waitFor({ state: 'visible', timeout: 45000 });
    }
  }

  async clickLogIn() {
    await this.loginButton().click();
  }

  async waitUntilSignedIn() {
    await this.logoutButton().waitFor({ state: 'visible', timeout: 90000 });
  }
}
