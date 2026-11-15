/**
 * The side menu is on screen at desktop widths.
 * On a phone it stays closed until the header menu button is used.
 */
export async function openMenuItem(page, title) {
  const item = page.locator(`[data-testid="app-menu-${title}"]`);
  if (!(await item.isVisible())) {
    // Ionic keeps the previous page, so more than one header can be in the DOM.
    await page.locator('[data-testid="app-header-menu"]:visible').last().click();
    await item.waitFor({ state: 'visible', timeout: 10000 });
  }
  await item.click();
}
