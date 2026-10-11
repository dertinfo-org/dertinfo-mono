/** Group configuration, members, teams, and gallery. */
import path from 'path';
import { GROUP_NAME, fixtureImage, group, team } from '../../shared-tools/loadData.js';
import { WEB_BASE, normalizeToken } from '../utils/helpers.mjs';
import {
  clickLabelledCheckbox,
  clickLabelledRadio,
  clickNext,
  clickPageAdd,
  entityCard,
  fillControl,
  groupAdminUrl,
} from './controls.mjs';

function peopleOfType(memberType) {
  const people = group.GroupMembers.filter((person) => person.MemberType === memberType);
  if (!people.length) throw new Error(`${group.GroupName} has no ${memberType}`);
  return people;
}

export class GroupPage {
  constructor(page) {
    this.page = page;
  }

  async configure(ctx) {
    const groupId = ctx.chain[normalizeToken('createdGroupId')];
    await this.page.goto(`${WEB_BASE}/group-configure/${encodeURIComponent(GROUP_NAME)}/${groupId}/start`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await fillControl(this.page, 'groupBio', group.GroupBio);
    await fillControl(this.page, 'originTown', group.OriginTown);
    await fillControl(this.page, 'originPostcode', group.OriginPostcode);
    await clickNext(this.page);
    await fillControl(this.page, 'contactName', group.PrimaryContactName);
    await fillControl(this.page, 'contactEmail', group.PrimaryContactEmail);
    await fillControl(this.page, 'contactTelephone', group.PrimaryContactNumber);
    await clickNext(this.page);
    await clickNext(this.page);
    await clickNext(this.page);
    await clickLabelledCheckbox(this.page, 'I agree to the terms and conditions');
    await clickNext(this.page);
    await this.page.getByRole('button', { name: 'Submit' }).click();
    await this.page.waitForURL(new RegExp(`/group/${encodeURIComponent(GROUP_NAME)}/${groupId}`), {
      timeout: 120000,
      waitUntil: 'commit',
    });
    ctx.provide('configuredGroupId', groupId);
    await this.page.goto(`${WEB_BASE}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const card = entityCard(this.page, GROUP_NAME);
    await card.waitFor({ state: 'visible', timeout: 30000 });
    if (await card.getByText('Needs more information').isVisible()) {
      throw new Error('Configured group still shows Needs more information');
    }
    await this.page.goto(groupAdminUrl(groupId), { waitUntil: 'domcontentloaded', timeout: 60000 });
  }

  async seeDefaultTeam(ctx) {
    const groupId = ctx.chain[normalizeToken('configuredGroupId')];
    await this.page.goto(groupAdminUrl(groupId, 'teams'), { waitUntil: 'domcontentloaded', timeout: 60000 });
    await this.page.locator('app-group-teams').getByText(GROUP_NAME, { exact: true }).waitFor({ state: 'visible', timeout: 30000 });
  }

  async addMember(ctx) {
    const groupId = ctx.chain[normalizeToken('configuredGroupId')];
    const people = peopleOfType('activeMember');
    for (const person of people) {
      await this.addPerson(groupId, person, 'Member');
      await this.page.getByText(person.Name).waitFor({ state: 'visible', timeout: 30000 });
    }
    ctx.provide('addedMemberId', people[0].Name);
  }

  async addGuest(ctx) {
    const groupId = ctx.chain[normalizeToken('configuredGroupId')];
    const people = peopleOfType('guest');
    for (const person of people) {
      await this.addPerson(groupId, person, 'Guest');
      await this.page.getByRole('tab', { name: 'Guests' }).click();
      await this.page.getByText(person.Name).waitFor({ state: 'visible', timeout: 30000 });
    }
    ctx.provide('addedGuestId', people[0].Name);
  }

  async addPerson(groupId, person, kind) {
    await this.page.goto(groupAdminUrl(groupId, 'members'), { waitUntil: 'domcontentloaded', timeout: 60000 });
    await clickPageAdd(this.page);
    await this.page.getByRole('tab', { name: 'Add New Person' }).click();
    await fillControl(this.page, 'name', person.Name);
    await clickLabelledRadio(this.page, kind);
    await this.page.getByRole('button', { name: /Add Member/ }).click();
  }

  async addTeam(ctx) {
    const groupId = ctx.chain[normalizeToken('configuredGroupId')];
    await this.page.goto(groupAdminUrl(groupId, 'teams'), { waitUntil: 'domcontentloaded', timeout: 60000 });
    await clickPageAdd(this.page);
    await this.page.getByRole('tab', { name: 'Add New Team' }).click();
    const groupTeam = team();
    await fillControl(this.page, 'teamName', groupTeam.TeamName);
    await fillControl(this.page, 'teamBio', groupTeam.TeamBio);
    await this.page.getByRole('button', { name: /Add Team/ }).click();
    await this.page.locator('app-group-teams').getByText(groupTeam.TeamName, { exact: true }).waitFor({ state: 'visible', timeout: 30000 });
    ctx.provide('addedTeamId', groupTeam.TeamName);
  }

  async changeImage(ctx) {
    const groupId = ctx.chain[normalizeToken('createdGroupId')];
    const imagePath = fixtureImage(group);
    const fileName = path.basename(imagePath);
    const groupPath = `${WEB_BASE}/group/${encodeURIComponent(GROUP_NAME)}/${groupId}/gallery`;
    await this.page.goto(groupPath, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await this.page.getByText('Uploaded Photos', { exact: true }).waitFor({ state: 'visible', timeout: 30000 });
    const before = await this.page.getByTestId('gallery-photo').locator('img').evaluateAll((images) => (
      images.map((image) => image.getAttribute('src')).filter(Boolean)
    ));
    await this.page.getByTestId('page-add').click();
    const dialog = this.page.getByRole('dialog');
    await dialog.getByText('Upload Images', { exact: true }).waitFor({ state: 'visible', timeout: 15000 });
    await dialog.getByTestId('upload-file').setInputFiles(imagePath);
    await dialog.getByText(fileName, { exact: true }).waitFor({ state: 'visible', timeout: 15000 });
    await dialog.getByTestId('upload-all').click();
    await dialog.waitFor({ state: 'hidden', timeout: 90000 });
    try {
      await this.page.waitForFunction((previous) => {
        const sources = [...document.querySelectorAll('[data-testid="gallery-photo"] img')]
          .map((image) => image.getAttribute('src'))
          .filter(Boolean);
        return sources.some((source) => !previous.includes(source));
      }, before, { timeout: 30000 });
    } catch {
      throw new Error('Uploaded photo did not replace the gallery image');
    }
  }
}
