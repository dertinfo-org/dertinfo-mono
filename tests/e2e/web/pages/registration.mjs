/** Group registration: open, attend, assign tickets, submit, amend, and confirm. */
import { defaultActivity, member, team, teamActivity } from '../../shared-tools/loadData.js';
import { WEB_BASE, normalizeToken } from '../utils/helpers.mjs';
import {
  EVENT_NAME,
  attendanceCard,
  clickLabelledCheckbox,
  clickNext,
  clickSelectOption,
  ensureAttendance,
  expectFlowState,
  groupAdminUrl,
  registrationRow,
  selectOption,
} from './controls.mjs';

export class RegistrationPage {
  constructor(page) {
    this.page = page;
  }

  async seeAvailableEvent(ctx) {
    const groupId = ctx.chain[normalizeToken('configuredGroupId')];
    await this.page.goto(groupAdminUrl(groupId, 'registrations'), { waitUntil: 'domcontentloaded', timeout: 60000 });
    await this.page.getByRole('tab', { name: 'Available / New' }).click();
    await this.page.getByText(EVENT_NAME).waitFor({ state: 'visible', timeout: 30000 });
  }

  async openRegistration(ctx) {
    const groupId = ctx.chain[normalizeToken('configuredGroupId')];
    const eventId = ctx.chain[normalizeToken('configuredEventId')];
    await this.page.goto(`${WEB_BASE}/group-register/${groupId}/${eventId}/start`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    for (let step = 0; step < 5; step += 1) {
      await clickNext(this.page);
    }
    await clickLabelledCheckbox(this.page, 'I agree to the terms and conditions');
    await this.page.getByRole('button', { name: 'Submit' }).click();
    await this.page.waitForURL(/\/group-registration\/\d+/, { timeout: 120000, waitUntil: 'commit' });
    const match = this.page.url().match(/\/group-registration\/(\d+)/);
    if (!match) throw new Error(`Registration did not open (${this.page.url()})`);
    await expectFlowState(this.page, 'New');
    ctx.provide('pendingRegistrationId', match[1]);
  }

  async addMember(ctx) {
    const registrationId = ctx.chain[normalizeToken('pendingRegistrationId')];
    await this.page.goto(`${WEB_BASE}/group-registration/${registrationId}/members`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await ensureAttendance(this.page, member('activeMember').Name);
  }

  async addGuest(ctx) {
    const registrationId = ctx.chain[normalizeToken('pendingRegistrationId')];
    await this.page.goto(`${WEB_BASE}/group-registration/${registrationId}/guests`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await ensureAttendance(this.page, member('guest').Name);
  }

  async addTeam(ctx) {
    const registrationId = ctx.chain[normalizeToken('pendingRegistrationId')];
    await this.page.goto(`${WEB_BASE}/group-registration/${registrationId}/teams`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await ensureAttendance(this.page, team().TeamName);
  }

  async openActivities(person) {
    const card = attendanceCard(this.page, person);
    await card.getByRole('button', { name: /Add Activities/ }).click();
    await this.page.getByText('Select Tickets').waitFor({ state: 'visible', timeout: 15000 });
    return card;
  }

  async assignActivities(ctx) {
    const registrationId = ctx.chain[normalizeToken('pendingRegistrationId')];
    await this.page.goto(`${WEB_BASE}/group-registration/${registrationId}/members`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    const memberName = member('activeMember').Name;
    const guestName = member('guest').Name;
    const teamName = team().TeamName;
    const individualTitle = defaultActivity().Title;
    const teamTitle = teamActivity().Title;

    const homer = attendanceCard(this.page, memberName);
    await homer.getByText(individualTitle).waitFor({ state: 'visible', timeout: 30000 });
    await this.openActivities(memberName);
    await selectOption(this.page, individualTitle).waitFor({ state: 'visible' });
    await this.page.getByRole('button', { name: 'Cancel' }).click();

    await this.page.goto(`${WEB_BASE}/group-registration/${registrationId}/guests`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    const marge = attendanceCard(this.page, guestName);
    await marge.getByText(individualTitle).waitFor({ state: 'visible', timeout: 30000 });
    await this.openActivities(guestName);
    await selectOption(this.page, individualTitle).waitFor({ state: 'visible' });
    await this.page.getByRole('button', { name: 'Cancel' }).click();

    await this.page.goto(`${WEB_BASE}/group-registration/${registrationId}/teams`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await this.openActivities(teamName);
    await clickSelectOption(this.page, teamTitle);
    await this.page.getByRole('button', { name: /Save Changes/ }).click();
    const teamCard = attendanceCard(this.page, teamName);
    await teamCard.getByText(teamTitle).waitFor({ state: 'visible', timeout: 30000 });
    await expectFlowState(this.page, 'New');
  }

  async editPending(ctx) {
    const registrationId = ctx.chain[normalizeToken('pendingRegistrationId')];
    await this.page.goto(`${WEB_BASE}/group-registration/${registrationId}/members`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    const person = member('activeMember');
    const title = defaultActivity().Title;
    const card = attendanceCard(this.page, person.Name);
    await card.getByRole('button', { name: /Add Activities/ }).click();
    await clickSelectOption(this.page, title);
    await this.page.getByRole('button', { name: /Save Changes/ }).click();
    await this.page.getByText('Select Tickets').waitFor({ state: 'hidden', timeout: 30000 });
    await this.page.reload({ waitUntil: 'domcontentloaded' });
    await card.getByText('Ticket Type').waitFor({ state: 'visible', timeout: 30000 });
    await card.getByText(title).waitFor({ state: 'hidden', timeout: 30000 });
    await expectFlowState(this.page, 'New');
  }

  async submit(ctx) {
    const registrationId = ctx.chain[normalizeToken('pendingRegistrationId')];
    const groupId = ctx.chain[normalizeToken('configuredGroupId')];
    await this.page.goto(groupAdminUrl(groupId, 'registrations'), { waitUntil: 'domcontentloaded', timeout: 60000 });
    await this.page.getByRole('tab', { name: 'Active' }).click();
    await registrationRow(this.page, registrationId).click();
    await this.page.waitForURL(new RegExp(`/group-registration/${registrationId}`), { timeout: 60000, waitUntil: 'commit' });
    await this.page.getByRole('button', { name: 'Submit' }).click();
    await expectFlowState(this.page, 'Submitted');
    ctx.provide('submittedRegistrationId', registrationId);
  }

  async amendSubmitted(ctx) {
    const registrationId = ctx.chain[normalizeToken('submittedRegistrationId')];
    await this.page.goto(`${WEB_BASE}/group-registration/${registrationId}/members`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    const person = member('activeMember');
    const title = defaultActivity().Title;
    const card = attendanceCard(this.page, person.Name);
    await card.getByRole('button', { name: /Add Activities/ }).click();
    await clickSelectOption(this.page, title);
    await this.page.getByRole('button', { name: /Save Changes/ }).click();
    await this.page.getByText('Select Tickets').waitFor({ state: 'hidden', timeout: 30000 });
    await this.page.reload({ waitUntil: 'domcontentloaded' });
    await card.getByText(title).waitFor({ state: 'visible', timeout: 30000 });
    await expectFlowState(this.page, 'Submitted');
  }

  async confirm(ctx) {
    const eventId = ctx.chain[normalizeToken('configuredEventId')];
    const registrationId = ctx.chain[normalizeToken('submittedRegistrationId')];
    await this.page.goto(`${WEB_BASE}/event/${encodeURIComponent(EVENT_NAME)}/${eventId}/registrations`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await registrationRow(this.page, registrationId).click();
    await this.page.waitForURL(new RegExp(`/event-registration/${registrationId}`), { timeout: 60000, waitUntil: 'commit' });
    await this.page.getByRole('button', { name: 'Confirm', exact: true }).click();
    await expectFlowState(this.page, 'Confirmed');
  }

  async seeConfirmed(ctx) {
    const registrationId = ctx.chain[normalizeToken('submittedRegistrationId')];
    await this.page.goto(`${WEB_BASE}/group-registration/${registrationId}/members`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await expectFlowState(this.page, 'Confirmed');
    if (await this.page.getByRole('button', { name: /Add Activities/ }).count()) {
      throw new Error('Group administrator can still edit a confirmed registration');
    }
  }
}
