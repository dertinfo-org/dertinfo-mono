---
name: Auth0 Management API edits
type: guide
status: active
updated: 2026-11-15
---

# Auth0 Management API edits

The Playwright runner can change a user on the **live development Auth0 tenant**. This runs before two app fixtures. It uses the Management API client secret from `infra/secrets/api.env`. Reloading a SQL pack does not undo it, and it does not undo a SQL pack.

How sign-in works for the product is in [Authentication](../subsystems/authentication.md). This page is only the test runner's write.

## Why the write exists

Saving a valid group-member pin in the app calls the API. The API adds that group's id to the signed-in user's Auth0 `app_metadata.groupmember` claim. The claim stays on the user after the browser closes.

`system-basic` reloads The Simpsons and The Flanders in SQL. It leaves the Auth0 user as it is. The next run would sign in already a member of both groups, and the checks for "only The Simpsons" would fail.

Before `groups.join-by-pin` and `results.own-team-dances`, the runner puts that claim back to the value in `tests/e2e/shared-data/auth0-personas.json`.

| | |
|--|--|
| User | `group-member-1@dertinfo.co.uk` |
| Claim | `groupmember` |
| Value written | `["1"]` (The Simpsons) |
| Tenant | `Auth0__Domain` in `infra/secrets/api.env` (the development tenant, `dertinfodev.eu.auth0.com`) |

## What the call does

`tests/e2e/shared-tools/auth0-persona.mjs` (`restorePersonaClaim`):

1. Reads `Auth0__Domain`, `Auth0__ManagementClientId`, and `Auth0__ManagementClientSecret` from gitignored `infra/secrets/api.env`. These are the same Management API client settings the API uses. The file is not committed.
2. Requests a Management API token with client credentials: `POST https://{domain}/oauth/token`, audience `https://{domain}/api/v2/`.
3. Looks the persona up with `GET https://{domain}/api/v2/users-by-email`.
4. Patches that user with `PATCH https://{domain}/api/v2/users/{id}`, setting `app_metadata.groupmember` to `["1"]`.

Other keys already on that user's `app_metadata` are copied and sent back unchanged. The runner does not print the client secret or the token. If any of the three settings is missing, or Auth0 rejects the call, the fixture stops before Chromium starts.

The Management API client on that tenant must be allowed to read users by email and to update `app_metadata`.

## What stays as it is

- Passwords, and every persona other than `group-member`.
- Website smoke, login warmup, and venue score capture. Those runs do not call the Management API.
- The API integration tests. They sign their own tokens and do not call Auth0.
- SQL. This write and `system-basic` are separate. Group-member fixtures do both: Auth0 first, then the SQL pack.

## Where it is called

`app/run-feature.mjs` calls `restorePersonaClaim` once, then applies the pack, then opens the browser. These two fixtures use that runner:

- `node app/fixtures/groups.join-by-pin/run.mjs`
- `node app/fixtures/results.own-team-dances/run.mjs`

`npm run test:app:smoke` runs venue score capture first, then those two. Venue score capture does not change Auth0. Each of the two group-member fixtures then performs this write for itself.

During the join scenario the test still signs out and signs back in before it checks the new group. That second sign-in is the product bug in [issue 149](https://github.com/dertinfo-org/dertinfo-mono/issues/149). It is not this Management API call. The Management API call is the reset between runs.
