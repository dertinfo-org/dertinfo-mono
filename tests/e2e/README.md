# DertInfo E2E scripts (Playwright)

Playwright scripts for the website and the app. Each journey is a fixture. This page is the layout to follow when adding one.

How to run the smoke suite and record video: [Website smoke tests](../../docs/technical/guides/website-smoke-tests.md).

How a website scenario is sized, how it calls page objects, and how session files are passed between scenarios: [Playwright standards](../../docs/technical/standards/playwright/README.md).

## Setup

```bash
cd tests/e2e
npm install
```

Chromium is installed automatically via `postinstall`.

The smoke suite expects the local profile already running. SQL is Docker. The API, image resize, Azurite, website, and PWA are native. Bring that profile up with `npm run doctor`, `npm run start`, and `npm run status` from the repo root.

## Suites

| Suite | Folder | npm script |
|-------|--------|------------|
| Website smoke | One fixture per feature that has tests. [`run-smoke.mjs`](web/run-smoke.mjs) runs them in order | `npm run test:web:smoke` |
| App smoke | One fixture per feature that has tests. [`run-smoke.mjs`](app/run-smoke.mjs) runs them in order | `npm run test:app:smoke` |
| Login warmup | [`web/fixtures/fixture-2/description.md`](web/fixtures/fixture-2/description.md) | `npm run test:login:warmup` |
| Shared tools | [`shared-tools/`](shared-tools/) | recording, form data, logins, and the planted-session helper |
| Shared data | [`shared-data/`](shared-data/) | form values, images, Auth0 personas, and login emails and passwords |
| Shared database state | [`shared-state/`](shared-state/) | `npm run apply:state -- system-basic` |
| Login id check | [`shared-state/apply.mjs`](shared-state/apply.mjs) | `npm run check:state -- system-basic` |

Persona passwords for the website smoke suite and the app fixture live in gitignored [`shared-data/logins.env`](shared-data/logins.env.example). [`shared-tools/logins.mjs`](shared-tools/logins.mjs) loads that file. Auth0 `app_metadata` for those users is in [`shared-data/auth0-personas.json`](shared-data/auth0-personas.json).

`npm run test:app:smoke -- --video all` records the app fixture in the same way as the website smoke suite. Modes and the `_recordings/` folder are described in [Website smoke tests](../../docs/technical/guides/website-smoke-tests.md#video).

Legacy Protractor e2e for Angular apps remains under `apps/dert-web/src/client/e2e/` and `apps/dert-app/src/client/e2e/`.

## Feature and scenario mapping

A Gherkin feature maps to one Playwright fixture. A Gherkin scenario maps to one Playwright test. A row is listed only when that pair is true. Website features are under `docs/capabilities/features/web/`. App features are under `docs/capabilities/features/app/`.

Login warmup is not a Gherkin feature, so it stays as [`web/fixtures/fixture-2`](web/fixtures/fixture-2/description.md).

| Gherkin feature | Playwright fixture | requires |
|---|---|---|
| [Cookie consent](../../docs/capabilities/features/web/cookie-consent.md) | [`public.cookie-consent`](web/fixtures/public.cookie-consent/description.md) | none |
| [Create event](../../docs/capabilities/features/web/events-create.md) | [`events.create`](web/fixtures/events.create/description.md) | `public.cookie-consent` |
| [Create and manage group](../../docs/capabilities/features/web/groups-manage.md) | [`groups.manage`](web/fixtures/groups.manage/description.md) | `public.cookie-consent` |
| [Submit event registration](../../docs/capabilities/features/web/registration-submit.md) | [`registration.submit`](web/fixtures/registration.submit/description.md) | `events.create`, `groups.manage` |
| [Confirm registrations](../../docs/capabilities/features/web/registration-confirm.md) | [`registration.confirm`](web/fixtures/registration.confirm/description.md) | `registration.submit` |
| [Invoicing and payment status](../../docs/capabilities/features/web/invoicing.md) | [`invoicing.payment-status`](web/fixtures/invoicing.payment-status/description.md) | `registration.confirm` |
| [Public content](../../docs/capabilities/features/web/public-content.md) | [`public.content`](web/fixtures/public.content/description.md) | none |
| [Stay signed in](../../docs/capabilities/features/web/auth-session-continuity.md) | [`auth.session-continuity`](web/fixtures/auth.session-continuity/description.md) | none |
| [Venue score capture](../../docs/capabilities/features/app/venue-score-capture.md) | [`scoring.venue-capture`](app/fixtures/scoring.venue-capture/description.md) | none |

Create event, create and manage group, and the register-for-event test still cover several Gherkin scenarios each. Those scenarios are not listed below.

| Gherkin scenario | Playwright test |
|---|---|
| Visitor accepts cookies | [`public.cookie-consent.visitor-accepts`](web/tests/public.cookie-consent.visitor-accepts.mjs) |
| Visitor browses public pages | [`public.content.visitor-browses`](web/tests/public.content.visitor-browses.mjs) |
| Rejected cache returns to sign-in | [`auth.session-continuity.rejected-cache-returns-to-sign-in`](web/tests/auth.session-continuity.rejected-cache-returns-to-sign-in.mjs) |
| Group administrator amends a submitted registration | [`registration.groupadmin.amends-submitted`](web/tests/registration.groupadmin.amends-submitted.mjs) |
| Event administrator confirms a registration | [`registration.event-admin.confirms`](web/tests/registration.event-admin.confirms.mjs) |
| Event administrator reviews invoices | [`invoicing.event-admin.reviews`](web/tests/invoicing.event-admin.reviews.mjs) |
| Group administrator reviews invoices | [`invoicing.group-admin.reviews`](web/tests/invoicing.group-admin.reviews.mjs) |
| Venue administrator signs in | [`scoring.venue-admin.signs-in`](app/tests/scoring.venue-admin.signs-in.mjs) |
| Venue administrator opens the first dance awaiting scores | [`scoring.venue-admin.opens-first-dance`](app/tests/scoring.venue-admin.opens-first-dance.mjs) |
| Venue administrator rejects an out-of-range score | [`scoring.venue-admin.rejects-out-of-range-score`](app/tests/scoring.venue-admin.rejects-out-of-range-score.mjs) |
| Venue administrator sends the scores | [`scoring.venue-admin.sends-scores`](app/tests/scoring.venue-admin.sends-scores.mjs) |
| Venue administrator photographs the score sheets | [`scoring.venue-admin.photographs-score-sheets`](app/tests/scoring.venue-admin.photographs-score-sheets.mjs) |
| Venue administrator confirms the dance is completed | [`scoring.venue-admin.confirms-dance-completed`](app/tests/scoring.venue-admin.confirms-dance-completed.mjs) |
| Venue administrator confirms the scores and photos remain | [`scoring.venue-admin.confirms-scores-and-photos`](app/tests/scoring.venue-admin.confirms-scores-and-photos.mjs) |

## How a fixture is built

A fixture is one Gherkin feature. The website suites live under `web/`. The app suite lives under `app/`. A fixture folder is the feature id, such as `web/fixtures/events.create/` or `app/fixtures/scoring.venue-capture/`. A fixture does not get its own copy of the shared data or the database packs.

```text
web/  or  app/
  run-smoke.mjs           runs the feature fixtures that have tests, in order
  fixtures/<feature-id>/
    description.md      what this fixture covers, and which tests it runs
    run-config.yaml     database pack, form data, video, and whether to clear the session
    run.mjs             the only entry point
  tests/                the scenarios, named for the screen, the person, and the job
  pages/                clicks and checks for one screen
  config/               device or suite settings (the app sets the iPhone size here)
  utils/                helpers used by more than one test in this suite
  reports/
```

`npm` scripts in `package.json` point at `web/run-smoke.mjs` and `app/run-smoke.mjs`. They do not point at a test file. A single fixture is `node web/fixtures/<feature-id>/run.mjs` or `node app/fixtures/<feature-id>/run.mjs`.

### description.md

The description says what the journey is, which tests belong to it, and which baseline it starts from. The front matter links the tests under `tests/` and the baseline pack. The body is the readable version of that list. Look at [events.create](web/fixtures/events.create/description.md), [login warmup](web/fixtures/fixture-2/description.md), and [scoring.venue-capture](app/fixtures/scoring.venue-capture/description.md).

### run-config.yaml

`run.mjs` reads `run-config.yaml` beside it. Comments in that file list the options. The command line overrides the file.

| Field | Values | Meaning |
|-------|--------|---------|
| `baseState` | `system-empty`, `system-basic`, `none` | Which pack to apply before the tests. `none` leaves the database as it is. |
| `eventData` | `event1`, `event2` | Website form event. Smoke only. |
| `groupData` | `group1`, `group2` | Website form group. Smoke only. |
| `video` | `none`, `errors`, `all` | `none` records nothing. That is the default. |
| `clearSession` | `true`, `false` | `true` removes shared-session files after a passing run. A failing run always leaves them. |
| `requires` | fixture ids, or `[]` | Other fixtures that must already have been run. `[]` means this fixture can run on its own. The runner does not check this yet. |

`system-empty` is the database after startup: system settings and migration history, with no events or groups. `system-basic` adds the seeded events, groups, competitions, and dances. Applying a pack does not drop SQL or restart the API.

The checked-in smoke and app configs are the sandbox: apply the pack, record nothing, and clear the session after a pass. Login warmup uses `baseState` `none`.

```bash
npm run apply:state -- system-empty
npm run apply:state -- system-basic
npm run check:state -- system-basic
npm run test:web:smoke -- --event-data event2 --group-data group2
npm run test:web:smoke -- --base-state none --clear-session false
npm run test:app:smoke -- --video all
```

`check:state` confirms the inserted ids match the Auth0 persona claims. The loader is [`shared-state/apply.mjs`](shared-state/apply.mjs).

`--base-state none` with `--clear-session false` keeps the database and the chain so one fixture can follow another. A flow id still selects one smoke scenario. It does not choose the form data, and it does not by itself skip the pack.

### run.mjs

`run.mjs` is the single entry point for that fixture. It:

1. Reads `run-config.yaml`, then applies any command-line overrides.
2. Applies `baseState` when it is not `none`.
3. Runs only the tests listed for this fixture, in the order the description gives.
4. Removes the files in `shared-session/` when every test passes and `clearSession` is true.
5. Leaves `shared-session/` in place when a test fails, or when `clearSession` is false.

The tests folder is shared by every fixture in that suite. The website smoke tests and the warmup tests both live in `web/tests/`. A runner lists its own files. It does not load every `.mjs` file in `tests/`.

### Tests and pages

A test file is one scenario. A page file holds the clicks and checks for one screen. The app fixture opens one browser for the feature and calls the tests in order. A website smoke test still opens the browsers for its own flow.

Name a new test `<object>.<persona>.<execution-detail>.mjs`:

- `scoring.venue-admin.signs-in.mjs` is score capture, acted on by the venue administrator, signing in.
- `warmup.signed-in.sticks-on-slow-status.mjs` is the warmup screen, acted on by the planted signed-in user, when status is slow.

`event.eventadmin.createandconfigure-scenario1.mjs` and `group.groupadmin.createandconfigure-scenario1.mjs` each still cover several Gherkin scenarios. The fixtures are already one feature each. The mapping table above lists a scenario only when the test is that scenario alone. How a page object is written is in [Playwright standards](../../docs/technical/standards/playwright/README.md#pages).

### Four stores

These four places are not interchangeable.

| Store | Path | What it holds | Checked in |
|-------|------|----------------|------------|
| Shared data | [`shared-data/`](shared-data/) | Values a person would type, images, Auth0 `app_metadata`, and login emails and passwords | Yes, except `logins.env` |
| Shared state | [`shared-state/`](shared-state/) | Rows the loader inserts into SQL | Yes |
| Shared session | [`shared-session/`](shared-session/) | Cookies, persona sessions, and `chain.json` shared by the fixtures | The README only |
| Shared tools | [`shared-tools/`](shared-tools/) | Recording, form-data loading, logins, and the fixture runner | Yes |

Shared data is [`events/event1.json`](shared-data/events/event1.json) and [`event2.json`](shared-data/events/event2.json), [`groups/group1.json`](shared-data/groups/group1.json) and [`group2.json`](shared-data/groups/group2.json), images under [`shared-data/images/`](shared-data/images/), [`auth0-personas.json`](shared-data/auth0-personas.json), and [`logins.env`](shared-data/logins.env.example). [`shared-tools/loadData.js`](shared-tools/loadData.js) reads the event and group named by the run config. Personas have no passwords. Both the website and the app use this folder.

Shared-state packs are what `apply.mjs` writes. `system-empty/baseline.json` is the post-startup snapshot. `system-basic/` adds events, groups, and competitions on top of that. Do not put form-entry files in a pack, and do not put SQL rows in `shared-data`.

Passwords stay in gitignored [`shared-data/logins.env`](shared-data/logins.env.example). [`shared-tools/logins.mjs`](shared-tools/logins.mjs) loads them. The key is `DERTINFO_E2E_<PERSONA>_EMAIL` and `DERTINFO_E2E_<PERSONA>_PASSWORD`, with hyphens in the persona name turned into underscores.

[`shared-session/`](shared-session/) is where every fixture reads and writes the session. Website smoke writes `chain.json` and `sessions/` there while the fixtures run. A passing run deletes those files and leaves the README. A failing run leaves them so the chain can be inspected or the next fixture can continue. Git keeps the folder and ignores everything inside it except `README.md`. Do not commit tokens, cookies, or session JSON.

Images a user would upload belong in `shared-data/images/`. A file that only one fixture needs can sit in that fixture, next to `description.md`. Do not copy shared form data or shared images into the fixture.

| Tool | Role |
|------|------|
| [`shared-tools/recording.mjs`](shared-tools/recording.mjs) | `--video none`, `errors`, or `all`. Clips go to `_recordings/` at the repo root. How to turn recording on is in [Website smoke tests](../../docs/technical/guides/website-smoke-tests.md#video) |
| [`shared-tools/loadData.js`](shared-tools/loadData.js) | Form values and image paths from `shared-data` |
| [`shared-tools/logins.mjs`](shared-tools/logins.mjs) | Persona emails and passwords from `shared-data/logins.env` |
| [`shared-tools/session.mjs`](shared-tools/session.mjs) | Plants a fake `localStorage` login for the warmup tests. This is not an Auth0 login |
| [`shared-tools/run-fixture.mjs`](shared-tools/run-fixture.mjs) | Runs one website feature fixture |
| [`shared-tools/run-config.mjs`](shared-tools/run-config.mjs) | Reads `run-config.yaml` and applies command-line overrides |

The website smoke browser is 1400 by 900. The app browser is an iPhone SE (320 by 568), set in [`app/config/device.mjs`](app/config/device.mjs).

## Record a session and turn it into a test

`--video` on an existing suite films a test that already exists. A new test starts from Playwright codegen: you click through the site, codegen writes an `.mjs` script, and that script is then rewritten into the suite.

Run the commands below from `tests/e2e`, with the local profile already up.

### 1. Save a signed-in session

Sign in as the person the test is about, go to the screen where the job starts, then close the Playwright window. This writes cookies and storage. It does not write the click script. A `.mjs` name on `--save-storage` does not change that: the file is still JSON.

Website, desktop size used by the smoke suite:

```bash
npx playwright codegen http://localhost:44200 --viewport-size=1400,900 --save-storage ../../_recordings/CodeGen/web-session.json
```

App, iPhone SE size used by the app tests:

```bash
npx playwright codegen http://localhost:44300 --device="iPhone SE" --save-storage ../../_recordings/CodeGen/app-session.json
```

Those paths are `_recordings/CodeGen/` at the repo root. `/_recordings/` is gitignored. The session file holds a live Auth0 login. Leave it uncommitted.

### 2. Record the job into an .mjs file

Load that session so the recording starts already signed in, and pass `--output` so the clicks are written to a file. Do one job, from the first useful screen to the last. Misclicks can stay in the file. Stay with one signed-in person.

Website:

```bash
npx playwright codegen http://localhost:44200 --viewport-size=1400,900 --load-storage ../../_recordings/CodeGen/web-session.json --output ../../_recordings/CodeGen/web-scratch-flow.mjs
```

App:

```bash
npx playwright codegen http://localhost:44300 --device="iPhone SE" --load-storage ../../_recordings/CodeGen/app-session.json --output ../../_recordings/CodeGen/app-scratch-flow.mjs
```

Close the Playwright window when the job is finished. The click script is written to `_recordings/CodeGen/` at the repo root (`web-scratch-flow.mjs` or `app-scratch-flow.mjs`). It should contain `page.goto`, `click`, and `fill`. An empty file means the window closed before codegen wrote the script.

If a password was typed during this step, replace that `fill` value with `PLACEHOLDER` before anyone reads the file. Passwords stay in `shared-data/logins.env`.

### 3. Turn the script into a test

The generated file is a click log. It is not the test. Ask for it to be read and rewritten.

Rewrite it into the fixture layout above. The test goes under `web/tests/` or `app/tests/`, named `<object>.<persona>.<execution-detail>.mjs`. Clicks go on a page object under `pages/`. How a page object is written is in [Playwright standards](../../docs/technical/standards/playwright/README.md#pages). The fixture's `description.md` lists the test, `run-config.yaml` names the database pack and the form data, and `run.mjs` is the entry point that runs it.

Sign-in goes through the existing persona helpers. Locators move onto `data-testid` where the suite already uses them. The app uses the iPhone SE context in `app/config/device.mjs`.
