/**
 * Persona emails and passwords for the app fixtures.
 * Values live in gitignored tests/e2e/shared-state/logins.env.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const loginsPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../shared-state/logins.env',
);

/** Load logins.env. Existing process variables win. */
export function loadLoginsEnv() {
  if (!fs.existsSync(loginsPath)) {
    throw new Error('tests/e2e/shared-state/logins.env is missing. Copy logins.env.example and fill it in.');
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

/** Venue administrator email and password from logins.env. */
export function venueAdminCredentials() {
  loadLoginsEnv();
  const email = process.env.DERTINFO_E2E_VENUE_ADMIN_EMAIL;
  const password = process.env.DERTINFO_E2E_VENUE_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('DERTINFO_E2E_VENUE_ADMIN_EMAIL and DERTINFO_E2E_VENUE_ADMIN_PASSWORD must be set in tests/e2e/shared-state/logins.env');
  }
  return { email, password };
}
