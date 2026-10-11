/** Public website pages a visitor can open without signing in. */
import { WEB_BASE, openContent } from '../utils/helpers.mjs';

export class PublicContentPage {
  constructor(page) {
    this.page = page;
  }

  async browse() {
    const homeErrors = await openContent(this.page, '/', { testId: 'public-home' });
    if (!this.page.url().startsWith(`${WEB_BASE}/home`)) {
      throw new Error(`/ did not land on /home (${this.page.url()})`);
    }
    const brand = await this.page.getByTestId('public-brand').innerText();
    if (!brand.replace(/\s+/g, '').includes('DertInfo')) {
      throw new Error('Home header did not show DertInfo');
    }
    await this.page.getByTestId('public-dashboard').waitFor({ state: 'visible' });
    if (homeErrors.length > 0) throw new Error(`Home had an uncaught page error: ${homeErrors[0]}`);

    await openContent(this.page, '/content/results', { testId: 'public-results' });
    await openContent(this.page, '/content/history', { testId: 'public-history', timeoutMs: 30000 });
    await openContent(this.page, '/content/community', { testId: 'public-community' });
    await openContent(this.page, '/content/notations', { testId: 'public-notations' });
    await openContent(this.page, '/dertofderts', { testId: 'public-dertofderts', timeoutMs: 45000 });
  }
}
