/** Event configuration wizard and the event activities list. */
import { activitiesByAudience, audienceLabel, defaultActivity, event, fixtureImage, formDate, teamActivity } from '../../shared-tools/loadData.js';
import { WEB_BASE, normalizeToken } from '../utils/helpers.mjs';
import {
  EVENT_NAME,
  clickLabelledCheckbox,
  clickNext,
  clickPageAdd,
  eventAdminUrl,
  fillControl,
  selectedStepHeader,
} from './controls.mjs';

export class EventPage {
  constructor(page) {
    this.page = page;
  }

  async fillDate(name, value) {
    const header = selectedStepHeader(this.page);
    const input = header.locator(`xpath=following::input[@formcontrolname="${name}"][1]`);
    await input.waitFor({ state: 'visible', timeout: 15000 });
    await input.click({ force: true });
    await input.fill(value, { force: true });
    await input.press('Tab');
  }

  async configure(ctx) {
    const eventId = ctx.chain[normalizeToken('createdEventId')];
    await this.page.goto(`${WEB_BASE}/event-configure/${encodeURIComponent(EVENT_NAME)}/${eventId}/start`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await fillControl(this.page, 'eventSynopsis', event.EventSynopsis);
    await this.fillDate('eventStartDate', formDate(event.EventStartDate));
    await this.fillDate('eventEndDate', formDate(event.EventEndDate));
    await fillControl(this.page, 'locationTown', event.LocationTown);
    await fillControl(this.page, 'locationPostcode', event.LocationPostcode);
    await clickNext(this.page);
    await fillControl(this.page, 'contactName', event.ContactName);
    await fillControl(this.page, 'contactEmail', event.ContactEmail);
    await fillControl(this.page, 'contactTelephone', event.ContactTelephone);
    await clickNext(this.page);
    await this.page.getByRole('button', { name: 'Change Image' }).click();
    await this.page.getByText('Upload Images', { exact: true }).waitFor({ state: 'visible', timeout: 15000 });
    await this.page.getByTestId('upload-file').setInputFiles(fixtureImage(event));
    await this.page.getByTestId('upload-all').click();
    await this.page.getByText('Upload Images', { exact: true }).waitFor({ state: 'hidden', timeout: 90000 });
    const preview = this.page.locator('app-image-retry img');
    try {
      await this.page.waitForFunction(() => {
        const input = document.querySelector('input[formcontrolname="eventPictureUrl"]');
        const image = document.querySelector('app-image-retry img');
        const src = image && image.getAttribute('src');
        return !!(input && input.value && src && src.includes('480x360'));
      }, null, { timeout: 30000 });
    } catch {
      const stored = await this.page.locator('input[formcontrolname="eventPictureUrl"]').inputValue().catch(() => '');
      const shown = await preview.first().getAttribute('src').catch(() => '');
      throw new Error(`Event image was not resized to 480x360 (stored ${stored}, shown ${shown})`);
    }
    await clickNext(this.page);
    await this.fillDate('registrationOpenDate', formDate(event.RegistrationOpenDate));
    await this.fillDate('registrationCloseDate', formDate(event.RegistrationCloseDate));
    await clickNext(this.page);
    await this.page.locator(`[data-testid="event-type"][data-event-type="${event.EventTemplateType}"]`).click();
    await clickNext(this.page);
    await clickLabelledCheckbox(this.page, 'I agree to the terms and conditions');
    await clickNext(this.page);
    await this.page.getByRole('button', { name: 'Submit' }).click();
    await this.page.waitForURL(new RegExp(`/event/${encodeURIComponent(EVENT_NAME)}/${eventId}`), {
      timeout: 120000,
      waitUntil: 'commit',
    });
    ctx.provide('configuredEventId', eventId);
    await this.page.goto(eventAdminUrl(eventId), { waitUntil: 'domcontentloaded', timeout: 60000 });
  }

  async addActivity(activity) {
    await clickPageAdd(this.page);
    const dialog = this.page.getByRole('dialog').last();
    await dialog.getByText('Add a new activity').waitFor({ state: 'visible', timeout: 15000 });
    await dialog.locator('input[formcontrolname="title"]').fill(activity.Title);
    await dialog.locator('input[formcontrolname="description"], textarea[formcontrolname="description"]').fill(activity.Description);
    await dialog.locator('input[formcontrolname="price"]').fill(String(activity.Price));
    await dialog.getByRole('combobox', { name: /Target Audience/ }).click();
    await this.page.getByRole('option', { name: audienceLabel(activity) }).click();
    if (activity.IsDefault) await dialog.locator('mat-checkbox').filter({ hasText: 'Set as Default' }).click();
    await dialog.getByRole('button', { name: /Add Activity/ }).click();
    await dialog.waitFor({ state: 'hidden', timeout: 30000 });
    await this.page.getByText(activity.Title, { exact: true }).waitFor({ state: 'visible', timeout: 30000 });
  }

  async addActivities(ctx) {
    const eventId = ctx.chain[normalizeToken('configuredEventId')];
    await this.page.goto(eventAdminUrl(eventId, 'activities'), { waitUntil: 'domcontentloaded', timeout: 60000 });
    for (const activity of activitiesByAudience(event, 'INDIVIDUAL')) await this.addActivity(activity);
    await this.page.getByRole('tab', { name: 'Team Activities' }).click();
    for (const activity of activitiesByAudience(event, 'TEAM')) await this.addActivity(activity);
    ctx.provide('addedIndividualActivityId', defaultActivity().Title);
    ctx.provide('addedTeamActivityId', teamActivity().Title);
  }
}
