/**
 * The side menu is on screen at desktop widths.
 * On a phone it stays closed until the header menu button is used.
 */
export async function openMenuItem(page, title) {
  const item = page.locator('#inbox-list').getByText(title, { exact: true });
  if (!(await item.isVisible())) {
    await page.locator('ion-menu-button >> visible=true').click();
    await item.waitFor({ state: 'visible', timeout: 10000 });
  }
  await item.click();
}
