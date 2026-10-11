/** Signed-in dashboard: create an event or group, and open one that still needs configuration. */
import { event, group } from '../../shared-tools/loadData.js';
import { WEB_BASE, normalizeToken, openFabItem, waitForDashboardFab } from '../utils/helpers.mjs';
import { EVENT_NAME, GROUP_NAME, entityCard, openCardMenu } from './controls.mjs';

export class DashboardPage {
  constructor(page) {
    this.page = page;
  }

  async createEvent(ctx) {
    await this.page.goto(`${WEB_BASE}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await openFabItem(this.page, 'create-event');
    await this.page.locator('input[formcontrolname="eventName"]').fill(event.Name);
    await this.page.locator('input[formcontrolname="eventSynopsis"]').fill(event.EventSynopsis);
    await this.page.getByRole('button', { name: /Add Event/ }).click();
    await this.page.waitForURL(/\/event-configure\/[^/]+\/\d+/, { timeout: 120000, waitUntil: 'commit' });
    const match = this.page.url().match(/\/event-configure\/[^/]+\/(\d+)/);
    if (!match) throw new Error(`Create event did not open configure (${this.page.url()})`);
    ctx.provide('createdEventId', match[1]);
  }

  async openUnconfiguredEvent(ctx) {
    const eventId = ctx.chain[normalizeToken('createdEventId')];
    await this.page.goto(`${WEB_BASE}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await waitForDashboardFab(this.page);
    await this.page.getByRole('tab', { name: /Events/ }).click();
    const card = entityCard(this.page, EVENT_NAME);
    await card.getByText('Needs more information').waitFor({ state: 'visible', timeout: 30000 });
    await openCardMenu(this.page, EVENT_NAME);
    await this.page.getByRole('menuitem', { name: 'Configure' }).click();
    await this.page.waitForURL(new RegExp(`/event-configure/.*/${eventId}/`), { timeout: 60000, waitUntil: 'commit' });
  }

  async createGroup(ctx) {
    await this.page.goto(`${WEB_BASE}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await openFabItem(this.page, 'create-group');
    await this.page.locator('input[formcontrolname="groupName"]').fill(group.GroupName);
    await this.page.locator('input[formcontrolname="groupBio"]').fill(group.GroupBio);
    await this.page.getByRole('button', { name: /Add Group/ }).click();
    await this.page.waitForURL(/\/group-configure\/[^/]+\/\d+/, { timeout: 120000, waitUntil: 'commit' });
    const match = this.page.url().match(/\/group-configure\/[^/]+\/(\d+)/);
    if (!match) throw new Error(`Create group did not open configure (${this.page.url()})`);
    ctx.provide('createdGroupId', match[1]);
  }

  async openUnconfiguredGroup(ctx) {
    const groupId = ctx.chain[normalizeToken('createdGroupId')];
    await this.page.goto(`${WEB_BASE}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await waitForDashboardFab(this.page);
    const card = entityCard(this.page, GROUP_NAME);
    await card.getByText('Needs more information').waitFor({ state: 'visible', timeout: 30000 });
    await openCardMenu(this.page, GROUP_NAME);
    await this.page.getByRole('menuitem', { name: 'Configure' }).click();
    await this.page.waitForURL(new RegExp(`/group-configure/.*/${groupId}/`), { timeout: 60000, waitUntil: 'commit' });
  }
}
