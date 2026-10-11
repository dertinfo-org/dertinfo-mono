import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.resolve(here, '../shared-data/images');
const sharedDataDir = path.resolve(here, '../shared-data');

function readDataSet(folder, fallback) {
  const name = process.env[folder === 'events' ? 'DERTINFO_E2E_EVENT_DATA' : 'DERTINFO_E2E_GROUP_DATA'] || fallback;
  const filePath = path.join(sharedDataDir, folder, `${name}.json`);
  if (!fs.existsSync(filePath)) throw new Error(`Form data is missing: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export const event = readDataSet('events', 'event1');
export const group = readDataSet('groups', 'group1');
export const events = [event];
export const groups = [group];

export const GROUP_NAME = group.GroupName;
export const EVENT_NAME = event.Name;

const audienceLabels = {
  INDIVIDUAL: 'Individual',
  TEAM: 'Team',
};

export function fixtureImage(record) {
  const fileName = record && record.Image;
  if (!fileName) throw new Error('Config record has no Image');
  const filePath = path.join(fixturesDir, fileName);
  if (!fs.existsSync(filePath)) throw new Error(`Form image is missing: ${filePath}`);
  return filePath;
}

export function formDate(isoDate) {
  const [year, month, day] = String(isoDate).split('-');
  if (!year || !month || !day) throw new Error(`Expected an ISO date, received ${isoDate}`);
  return `${day}/${month}/${year}`;
}

export function audienceLabel(activity) {
  const label = audienceLabels[activity.AudienceTypeId];
  if (!label) throw new Error(`Unknown AudienceTypeId ${activity.AudienceTypeId}`);
  return label;
}

export function member(memberType, record = group) {
  const found = record.GroupMembers.find((person) => person.MemberType === memberType);
  if (!found) throw new Error(`${record.GroupName} has no ${memberType}`);
  return found;
}

export function team(record = group) {
  const found = record.Teams[0];
  if (!found) throw new Error(`${record.GroupName} has no team`);
  return found;
}

export function activitiesByAudience(record, audienceType) {
  return record.Activities.filter((activity) => activity.AudienceTypeId === audienceType);
}

export function defaultActivity(record = event) {
  const found = record.Activities.find((activity) => activity.IsDefault && activity.AudienceTypeId === 'INDIVIDUAL');
  if (!found) throw new Error(`${record.Name} has no default individual activity`);
  return found;
}

export function teamActivity(record = event) {
  const found = record.Activities.find((activity) => activity.AudienceTypeId === 'TEAM');
  if (!found) throw new Error(`${record.Name} has no team activity`);
  return found;
}
