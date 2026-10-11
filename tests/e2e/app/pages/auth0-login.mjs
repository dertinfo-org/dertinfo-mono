/** Auth0 Universal Login, shown after the app header Log in button. */
export class Auth0LoginPage {
  constructor(page) {
    this.page = page;
  }

  async signIn(email, password) {
    const username = this.page.locator('input[name="username"], input[name="email"], input#username').first();
    await username.waitFor({ state: 'visible', timeout: 30000 });
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
