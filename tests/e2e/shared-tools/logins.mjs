/**
 * Persona emails and passwords for the website smoke suite and the app fixtures.
 * Values live in gitignored tests/e2e/shared-data/logins.env.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const loginsPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../shared-data/logins.env',
);

/** Load logins.env. Existing process variables win. */
export function loadLoginsEnv() {
  if (!fs.existsSync(loginsPath)) {
    throw new Error('tests/e2e/shared-data/logins.env is missing. Copy logins.env.example and fill it in.');
  }
  for (const line of fs.readFileSync(loginsPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index < 1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    if (process.env[key] == null || process.env[key] === '') process.env[key] = value;
  }
}

/** Email and password for a persona such as event-admin or group-admin-2. */
export function personaCredentials(persona) {
  loadLoginsEnv();
  const envName = persona.toUpperCase().replace(/-/g, '_');
  const email = process.env[`DERTINFO_E2E_${envName}_EMAIL`];
  const password = process.env[`DERTINFO_E2E_${envName}_PASSWORD`];
  if (!email || !password) {
    throw new Error(`${persona} email and password must be set in tests/e2e/shared-data/logins.env`);
  }
  return { email, password };
}

/** Venue administrator email and password from logins.env. */
export function venueAdminCredentials() {
  return personaCredentials('venue-admin');
}
