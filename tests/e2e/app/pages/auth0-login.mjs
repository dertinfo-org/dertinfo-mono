/** Auth0 Universal Login, shown after the app header Log in button. */
export class Auth0LoginPage {
  constructor(page) {
    this.page = page;
  }

  async signIn(email, password) {
    const username = this.page.locator('input[name="username"], input[name="email"], input#username').first();
    const consent = this.page.getByRole('button', { name: 'Accept' });
    const arrived = await Promise.race([
      username.waitFor({ state: 'visible', timeout: 30000 }).then(() => 'username'),
      consent.waitFor({ state: 'visible', timeout: 30000 }).then(() => 'consent'),
    ]);
    // A second sign-in in the same browser can skip the form and land on consent.
    if (arrived === 'consent') return;
    await username.fill(email);
    let passwordBox = this.page.locator('input[name="password"], input#password').first();
    if (!(await passwordBox.isVisible().catch(() => false))) {
      await this.page.locator('button[type="submit"], button[name="action"]').first().click();
      passwordBox = this.page.locator('input[name="password"], input#password').first();
      await passwordBox.waitFor({ state: 'visible', timeout: 15000 });
    }
    await passwordBox.fill(password);
    await this.page.locator('button[type="submit"], button[name="action"]').first().click();
  }
}
