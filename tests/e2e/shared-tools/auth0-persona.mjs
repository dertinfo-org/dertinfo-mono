/**
 * Puts an Auth0 persona claim back to the value in auth0-personas.json.
 * Entering a group pin writes the new group onto the live user, so a later run
 * would otherwise start with both groups already joined.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const secretsPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../infra/secrets/api.env',
);

function readApiEnv() {
  if (!fs.existsSync(secretsPath)) {
    throw new Error(`Auth0 settings are missing: ${secretsPath}`);
  }
  const values = {};
  for (const line of fs.readFileSync(secretsPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index < 1) continue;
    values[trimmed.slice(0, index).trim()] = trimmed.slice(index + 1).trim();
  }
  return values;
}

async function managementToken(domain, clientId, clientSecret) {
  const response = await fetch(`https://${domain}/oauth/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      audience: `https://${domain}/api/v2/`,
    }),
  });
  if (!response.ok) {
    throw new Error(`Auth0 management token request failed (${response.status})`);
  }
  const body = await response.json();
  if (!body.access_token) throw new Error('Auth0 management token response had no access token');
  return body.access_token;
}

/** Set one app_metadata claim on the persona email. Other metadata keys stay as they are. */
export async function restorePersonaClaim(email, claim, values) {
  const env = readApiEnv();
  const domain = (env.Auth0__Domain || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
  const clientId = env.Auth0__ManagementClientId;
  const clientSecret = env.Auth0__ManagementClientSecret;
  if (!domain || !clientId || !clientSecret) {
    throw new Error('api.env must set Auth0__Domain, Auth0__ManagementClientId, and Auth0__ManagementClientSecret');
  }
  const token = await managementToken(domain, clientId, clientSecret);
  const headers = { authorization: `Bearer ${token}`, 'content-type': 'application/json' };
  const listed = await fetch(
    `https://${domain}/api/v2/users-by-email?email=${encodeURIComponent(email)}`,
    { headers },
  );
  if (!listed.ok) throw new Error(`Auth0 user lookup failed (${listed.status})`);
  const users = await listed.json();
  const user = users.find((item) => item.email === email);
  if (!user) throw new Error(`Auth0 has no user for ${email}`);
  const appMetadata = { ...(user.app_metadata || {}), [claim]: values };
  const updated = await fetch(`https://${domain}/api/v2/users/${encodeURIComponent(user.user_id)}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ app_metadata: appMetadata }),
  });
  if (!updated.ok) throw new Error(`Auth0 user update failed (${updated.status})`);
}
