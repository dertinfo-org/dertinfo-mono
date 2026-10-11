import { EVENT_NAME, GROUP_NAME } from '../../shared-tools/loadData.js';
import { WEB_BASE } from '../utils/helpers.mjs';

export { EVENT_NAME, GROUP_NAME };

function cssAttr(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function groupAdminUrl(groupId, child = 'overview') {
  return `${WEB_BASE}/group/${encodeURIComponent(GROUP_NAME)}/${groupId}/${child}`;
}

export function eventAdminUrl(eventId, child = 'overview') {
  return `${WEB_BASE}/event/${encodeURIComponent(EVENT_NAME)}/${eventId}/${child}`;
}

export function entityCard(page, title) {
  return page.locator(`[data-testid="entity-card"][data-card-title="${cssAttr(title)}"]`);
}

export function attendanceCard(page, title) {
  return page.locator(`[data-testid="attendance-card"][data-card-title="${cssAttr(title)}"]`);
}

export function registrationRow(page, id) {
  return page.locator(`[data-testid="registration-row"][data-registration-id="${cssAttr(id)}"]`);
}

export function selectOption(scope, name) {
  return scope.locator(`[data-testid="select-option"][data-option-name="${cssAttr(name)}"]`);
}

export async function fillControl(page, name, value) {
  const input = page.locator(`input[formcontrolname="${name}"], textarea[formcontrolname="${name}"]`);
  // Inactive Material steps are inert and visibility:hidden. A fill before the step is visible does not update the control.
  await input.waitFor({ state: 'visible', timeout: 15000 });
  await input.fill(value, { force: true });
}

export async function clickLabelledCheckbox(page, label) {
  await page.locator('mat-checkbox').filter({ hasText: label }).click();
}

export async function clickLabelledRadio(page, label) {
  await page.locator('mat-radio-button').filter({ hasText: new RegExp(`^\\s*${label}\\s*$`) }).click();
}

export async function clickPageAdd(page) {
  await page.getByTestId('page-add').click();
}

export async function clickSelectOption(page, name) {
  await selectOption(page, name).getByTestId('select-option-toggle').click();
}

/** The selected Material 21 step header is aria-current="step". aria-selected is gone. */
export function selectedStepHeader(page) {
  return page.locator('mat-step-header[aria-current="step"]');
}

/** Advance the visible stepper step. The Next button is the one after the selected header. */
export async function clickNext(page) {
  const header = selectedStepHeader(page);
  await header.waitFor({ state: 'visible', timeout: 15000 });
  const id = await header.getAttribute('id');
  const index = Number(id && id.match(/-label-(\d+)$/)?.[1]);
  const next = header.locator('xpath=following::button[normalize-space(.)="Next"][1]');
  await next.click();
  await page.locator(`mat-step-header[aria-current="step"][id$="-label-${index + 1}"]`).waitFor({
    state: 'visible',
    timeout: 15000,
  });
}

export async function openCardMenu(page, title) {
  const card = entityCard(page, title);
  await card.getByTestId('card-menu').click();
  return card;
}

export async function bodyText(page) {
  return (await page.locator('body').innerText()).replace(/\u00a0/g, ' ');
}

export async function expectFlowState(page, name) {
  try {
    await page.getByRole('radio', { name, exact: true, checked: true }).waitFor({
      state: 'visible',
      timeout: 30000,
    });
  } catch {
    throw new Error(`Registration flow state is not ${name}`);
  }
}

export async function ensureAttendance(page, name) {
  await clickPageAdd(page);
  const dialog = page.locator('mat-dialog-container');
  const item = selectOption(dialog, name);
  await item.waitFor({ state: 'visible', timeout: 15000 });
  if ((await item.getAttribute('data-selected')) === 'true') {
    await dialog.getByRole('button', { name: 'Cancel' }).click();
  } else {
    await item.getByTestId('select-option-toggle').click();
    await dialog.getByRole('button', { name: /Save Changes/ }).click();
  }
  await dialog.waitFor({ state: 'hidden', timeout: 30000 });
  await attendanceCard(page, name).waitFor({ state: 'visible', timeout: 30000 });
}
