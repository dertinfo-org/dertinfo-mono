---
name: Testing
type: guide
status: active
updated: 2026-11-15
---

# Testing

How the suites start, what the framework is allowed to change, and how a test is laid out. Website click-by-click commands stay in [Website smoke tests](../guides/website-smoke-tests.md). API commands stay in [API integration tests](../guides/api-integration-tests.md). Fixture and page-object rules stay in [Playwright standards](../standards/playwright/README.md). The feature-to-fixture table is in [tests/e2e/README.md](../../../tests/e2e/README.md).

## Suites

| Suite | What it drives | Start from | Command |
|-------|----------------|------------|---------|
| Website smoke | `apps/dert-web` on port 44200 | `tests/e2e` | `npm run test:web:smoke` |
| App smoke | `apps/dert-app` on port 44300 | `tests/e2e` | `npm run test:app:smoke` |
| Login warmup | Website, planted session | `tests/e2e` | `npm run test:login:warmup` |
| API integration | `apps/dert-api` | repo root | [API integration tests](../guides/api-integration-tests.md) |

Playwright needs the local estate up (`npm run doctor`, `npm run start`, `npm run status` from the repo root) and `tests/e2e/shared-data/logins.env` copied from `logins.env.example`. Install the runner once with `npm install` inside `tests/e2e`. The API suite uses its own SQL container and does not need the website, the app, or an Auth0 login.

## Start a run

From `tests/e2e`.

```bash
npm run test:web:smoke
npm run test:app:smoke
node web/fixtures/events.create/run.mjs
node app/fixtures/groups.join-by-pin/run.mjs
node app/fixtures/results.own-team-dances/run.mjs
```

`npm run test:app:smoke` runs three fixtures in order: venue score capture, then join a group with a pin, then view own-team dances. Venue score capture writes scores. The two group-member fixtures each apply `system-basic` again so those scores are cleared, and each one also [puts the group-member Auth0 user back](auth0-management.md) before the browser opens.

One fixture is that folder's `run.mjs`. Pass `--base-state none` when the fixture must keep the database already loaded. Pass `--clear-session false` when the next fixture must still see `shared-session`.

```bash
node web/fixtures/registration.submit/run.mjs --base-state none --clear-session false
```

Video is off unless you pass `--video`. The mode is `all`, `errors`, or `none`. npm needs a `--` so the flag reaches the runner. A direct `node` call does not.

```bash
npm run test:app:smoke -- --video all
node app/fixtures/groups.join-by-pin/run.mjs --video all
```

Clips land in `_recordings/YYYYMMDD-HHMM/` at the repo root. Folder rules are in [Website smoke tests](../guides/website-smoke-tests.md#video). The same flag works for the website suite and the app suite.

Reload a database pack on its own:

```bash
npm run apply:state -- system-basic
npm run check:state -- system-basic
```

`check:state` confirms the inserted ids match the Auth0 persona claims in `shared-data/auth0-personas.json`. Applying a pack rewrites fixture rows. It does not drop SQL, restart the API, or change Auth0.

## What the framework can change

| Change | Who does it | Limit |
|--------|-------------|-------|
| SQL packs `system-empty` and `system-basic` | `shared-state/apply.mjs`, before a fixture whose `baseState` is that pack | Rewrites fixture rows. Leaves `SystemSettings` and `__EFMigrationsHistory`. Does not edit Auth0. |
| Auth0 `app_metadata` on the development tenant | `shared-tools/auth0-persona.mjs`, before the two group-member app fixtures | One claim on one user, put back to the persona file. [Full rules](auth0-management.md). |
| Browser session files | Website fixtures, under `tests/e2e/shared-session/` | Cookies, persona sessions, and `chain.json`. A passing run with `clearSession: true` deletes them. A failing run leaves them. |
| Video | `--video` | Gitignored files under `_recordings/`. |
| API integration database | `dertinfo-api.itests` | A separate SQL container. Authenticated cases use a token that test host signs. That suite does not call Auth0. |

Persona passwords stay in gitignored `tests/e2e/shared-data/logins.env`. The runner reads them to sign in. It does not write them back to Auth0.

## How a test is structured

A Gherkin feature is one fixture folder. A Gherkin scenario is one test file. The fixture lists its own files. It does not load every file in `tests/`.

```text
tests/e2e/
  web/fixtures/<feature-id>/    website feature: run.mjs, run-config.yaml, description.md
  web/tests/                    website scenarios
  web/pages/                    website screens
  app/fixtures/<feature-id>/    app feature: run.mjs, run-config.yaml, description.md
  app/tests/                    app scenarios
  app/pages/                    app screens
  shared-data/                  form values, images, Auth0 personas, login emails and passwords
  shared-state/                 SQL packs
  shared-session/               cookies and chain.json written during a run
  shared-tools/                 recording, logins, pack apply, website runner, Auth0 claim restore
```

Website fixtures call `shared-tools/run-fixture.mjs`. A website scenario opens the browsers for its own flow and can pass tokens to the next scenario through `chain.json`.

App fixtures open one iPhone-sized Chromium window and run that feature's scenarios in order on the same page. Venue score capture keeps that loop in its own `run.mjs` because it fakes a camera. The two group-member fixtures call `app/run-feature.mjs`, which restores the Auth0 claim, applies the pack, then runs the scenarios.

`run-config.yaml` beside `run.mjs` sets `baseState`, `video`, `clearSession`, and `requires`. The command line overrides the file. `requires` records the order. The runner does not check that list yet.

The API suite is a .NET test project at `apps/dert-api/src/dertinfo-api.itests`. It is not a Playwright fixture.

New Playwright coverage follows the existing feature: add the capability page, add a fixture folder named for that feature id, add one test file per scenario, and add a row to the mapping table in `tests/e2e/README.md`.
