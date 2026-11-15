/**
 * Groups, teams, and pins from the system-basic pack, matched to the group-member persona.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const e2eRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(e2eRoot, relativePath), 'utf8'));
}

/** The group the persona already belongs to, and the other seeded group they can join with a pin. */
export function basicGroupMembership() {
  const groups = readJson('shared-state/system-basic/groups.json');
  const personas = readJson('shared-data/auth0-personas.json');
  const persona = personas.personas.find((item) => item.id === 'group-member');
  if (!persona) throw new Error('Auth0 persona "group-member" is missing');
  const memberIds = (persona.app_metadata.groupmember || []).map((id) => Number(id));
  const joined = groups.filter((group) => memberIds.includes(group.Auth0ForcedId));
  const others = groups.filter((group) => !memberIds.includes(group.Auth0ForcedId));
  if (joined.length !== 1 || others.length !== 1) {
    throw new Error('system-basic needs one group the group member already belongs to, and one other group');
  }
  const current = joined[0];
  const other = others[0];
  return {
    email: persona.email,
    currentGroup: current.GroupName,
    currentTeam: current.Teams[0].TeamName,
    otherGroup: other.GroupName,
    otherTeam: other.Teams[0].TeamName,
    otherPin: other.GroupMemberJoiningPinCode,
    unknownPin: '0000',
    memberGroupIds: memberIds.map(String),
  };
}
