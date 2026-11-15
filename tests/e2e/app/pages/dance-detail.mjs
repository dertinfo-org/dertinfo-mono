/** One dance: score form, send, and the photos tab. */
export class DanceDetailPage {
  constructor(page) {
    this.page = page;
  }

  scoreRows() {
    return this.page.locator('form ion-item').filter({ has: this.page.locator('ion-input') });
  }

  sendScoresButton() {
    return this.page.getByRole('button', { name: /Send Scores/ });
  }

  takePhotoButton() {
    return this.page.locator('photo-button').getByRole('button', { name: /Take Photo/ });
  }

  async assertResultsHidden() {
    await this.page.locator('[data-testid="dance-results-hidden"]').waitFor({ state: 'visible', timeout: 30000 });
    if (await this.sendScoresButton().isVisible().catch(() => false)) {
      throw new Error('Send Scores is shown for a group member');
    }
  }

  async waitForTeam(teamName) {
    await this.page.locator('page-dance-detail').getByRole('heading', { name: teamName, exact: true }).waitFor({ state: 'visible', timeout: 30000 });
  }

  async readScorePlan() {
    const rows = this.scoreRows();
    await rows.first().waitFor({ state: 'visible', timeout: 30000 });
    const count = await rows.count();
    const plan = [];
    for (let index = 0; index < count; index += 1) {
      const label = (await rows.nth(index).locator('ion-label').innerText()).replace(/\s+/g, ' ').trim();
      const match = label.match(/\[(\d+)\s*marks\]/i);
      if (!match) throw new Error(`Score label did not include a maximum: ${label}`);
      const max = Number(match[1]);
      plan.push({ label, max, value: max >= 1 ? '1' : '0' });
    }
    return plan;
  }

  async fillScore(index, value) {
    const box = this.scoreRows().nth(index).getByRole('textbox');
    await box.click();
    await box.fill(value);
    await box.blur();
  }

  async fillScores(plan) {
    for (let index = 0; index < plan.length; index += 1) {
      await this.fillScore(index, plan[index].value);
    }
  }

  async waitForOutOfRange() {
    await this.scoreRows().nth(0).locator('ion-input.has-error').waitFor({ state: 'attached', timeout: 5000 });
  }

  async sendScoresDisabled() {
    return this.sendScoresButton().evaluate((element) => element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true');
  }

  async waitForScoresValid() {
    await this.page.waitForFunction(() => !document.querySelector('form ion-input.has-error'));
  }

  async sendScores() {
    await this.sendScoresButton().click();
  }

  async openPhotosTab() {
    await this.segmentButton('Photos').click();
  }

  /** After scores are sent, the photos pane should already be showing. */
  async ensurePhotoCapture() {
    await this.takePhotoButton().waitFor({ state: 'visible', timeout: 15000 });
  }

  segmentButton(name) {
    return this.page.locator('ion-segment-button').filter({ hasText: name });
  }

  async openScores() {
    await this.segmentButton('Scores').click();
    await this.scoreRows().first().waitFor({ state: 'visible', timeout: 30000 });
  }

  async scoreValue(index) {
    return (await this.scoreRows().nth(index).getByRole('textbox').inputValue()).trim();
  }

  async waitForResizedSheets(count) {
    await this.page.waitForFunction((expected) => {
      const images = [...document.querySelectorAll('photo-widget img')];
      const ready = images.filter((img) => {
        const src = `${img.getAttribute('src') || ''} ${img.src || ''}`;
        return src.includes('/480x360/')
          && !src.includes('loading-avatar')
          && !src.includes('missing-document')
          && !src.includes('broken.png')
          && img.complete
          && img.naturalWidth > 0;
      });
      return ready.length >= expected;
    }, count, { timeout: 45000 });
  }
}
