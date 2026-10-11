/** Capacitor camera screen opened from Take Photo on the dance. */
export class CameraPage {
  constructor(page) {
    this.page = page;
  }

  async capture() {
    await this.page.locator('photo-button').getByRole('button', { name: /Take Photo/ }).click();
    const shutter = this.page.locator('.shutter-button');
    await shutter.waitFor({ state: 'visible', timeout: 15000 });
    await shutter.click();
    const accept = this.page.locator('.item.accept-use');
    await accept.waitFor({ state: 'visible', timeout: 15000 });
    await accept.click();
  }
}
