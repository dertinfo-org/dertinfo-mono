---
name: Website smoke tests
type: guide
status: active
updated: 2026-10-11
---

# Website smoke tests

How to run the website end-to-end smoke suite, including video. How a scenario is built, how large it is, and how session state is kept is in [Playwright standards](../standards/playwright/README.md).

## Before you run

The local estate is already up. From the repo root: `npm run doctor`, `npm run start`, `npm run status`. Day-to-day startup is in [Local development](local-development.md).

`infra/dev/runtime.json` (gitignored) for this suite:

| Service | Mode |
|---------|------|
| sql | docker |
| api, web, app, imageResize, azurite | native |

`sql.mode` is `docker`. `api.mode` is `native` or `docker`. `infra/secrets/api.env` points `SqlConnection__ServerName` at `127.0.0.1,44000`, with the Compose `sa` login and database `DertInfoDb`.

| Service | URL |
|---------|-----|
| Web | http://localhost:44200 |
| PWA | http://localhost:44300 |
| API | http://localhost:44100/api |
| Image resize | http://localhost:44400 |
| Azurite | http://127.0.0.1:10000 |
| SQL | localhost,44000 |

Install the runner once:

```bash
cd tests/e2e
npm install
```

`postinstall` installs Chromium. Persona passwords live in gitignored `tests/e2e/shared-data/logins.env` (copy `logins.env.example`). Auth0 `app_metadata` for those users is in `tests/e2e/shared-data/auth0-personas.json`. Emails are `event-admin-1@dertinfo.co.uk` and `group-admin-1@dertinfo.co.uk` on tenant `dertinfodev.eu.auth0.com`.

## Run the suite

From `tests/e2e`:

```bash
npm run test:web:smoke
```

That command runs every smoke flow, in order, using `web/fixtures/fixture-1/run-config.yaml`. The checked-in file applies `system-empty`, types `event1` and `group1`, records nothing, and clears the session after a pass.

`system-empty` is the database after startup: system settings and migration history, with no events or groups. The runner applies that pack in place. It does not drop SQL, delete the data volume, or restart the API. The previous smoke chain is discarded. Auth0 session files are left in place until a passing run clears them.

Order:

1. Cookie consent
2. Event administrator creates and configures an event
3. Group administrator creates and configures a group
4. Group administrator registers that group for the event
5. Group administrator amends the registration; the event administrator confirms it; both review the invoice
6. A visitor browses the public pages

`auth.session-continuity.rejected-cache-returns-to-sign-in` stays available and is left out of this command. Pass its id to run it on its own.

The console prints `PASS` or `FAIL` for each flow. Inside a flow it prints each part as soon as that part finishes:

```text
PASS group.groupadmin.createandconfigure-scenario1 > create
PASS group.groupadmin.createandconfigure-scenario1 > add member
FAIL group.groupadmin.createandconfigure-scenario1 > change image
FAIL group.groupadmin.createandconfigure-scenario1
```

A failed part is printed before the flow itself is marked failed. Later flows that need its data stop with `prerequisites not available` and do not open a browser.

## Run one flow

Name the flow id to run only that flow. The database and the form data still come from `run-config.yaml`. The default applies `system-empty`, which removes events and groups from an earlier flow. To keep the database and the chain, pass `--base-state none --clear-session false`. The flow runs when the tokens it requires are already in `tests/e2e/web/fixtures/fixture-1/run-state/chain.json`. When they are missing, it stops with `prerequisites not available`. A passing run removes the files in that folder when `clearSession` is true. A failing run leaves them.

```bash
npm run test:web:smoke -- public.cookie-consent.visitor-accepts
node web/fixtures/fixture-1/run.mjs public.cookie-consent.visitor-accepts
npm run test:web:smoke -- --event-data event2 --group-data group2
npm run test:web:smoke -- --base-state none --clear-session false public.cookie-consent.visitor-accepts
```

`--event-data` is `event1` or `event2`. `--group-data` is `group1` or `group2`. Those files are the values the flows type. The flow id chooses which scenarios run. It does not choose the form data.

Cookie consent has no predecessor, so it can run on its own against the site that is already up. Registration needs a configured group and a configured event already in the database, and the tokens still in `run-state`. Those tokens remain when an earlier run failed.

## Video

Recording is off unless you pass `--video`. The value is `all`, `errors`, or `none`.

| Mode | What is kept |
|------|----------------|
| `none` | Nothing. This is the default. |
| `all` | A clip for every browser a flow opened |
| `errors` | Clips only for flows that fail. A run that passes everything leaves no folder |

From `tests/e2e`, npm needs a separator so the flag reaches the runner:

```bash
npm run test:web:smoke -- --video errors
```

- The `--` with a space after it belongs to npm. It means "append the rest of this line to the script." npm consumes it. The runner never sees it.
- `--video` is one flag. The next word is the mode. A flow id after that is optional.

```bash
npm run test:web:smoke
npm run test:web:smoke -- --video errors
npm run test:web:smoke -- --video all public.cookie-consent.visitor-accepts
```

The first command records nothing and applies `system-empty`. The second keeps videos only for flows that fail. The third records that one flow. Add `--base-state none` when that one flow must keep the database already in place.

Calling the runner directly has no npm separator:

```bash
node web/fixtures/fixture-1/run.mjs --video errors public.cookie-consent.visitor-accepts
```

Videos for one run go in `_recordings/YYYYMMDD-HHMM/` at the repo root, using local time. Each flow has its own subfolder. Clips are numbered in the order the browsers opened (`01-cookie-consent.webm`, `02-login.webm`, `03-page.webm`). A second run in the same minute uses `YYYYMMDD-HHMM-2`. After a recording run, only the three newest timestamp folders remain. An `errors` run that passes everything leaves no folder. Move a folder out of `_recordings` to keep it longer. The folder is gitignored.

A flow that does several jobs in one browser produces one clip for that stretch. Sign-in, and a later actor, each open another browser and so another clip. The mapping from page calls to clips is in [Playwright standards](../standards/playwright/README.md#videos-and-steps).

## Other scripts

`npm run test:login:warmup` runs the warmup fixture at `tests/e2e/web/fixtures/fixture-2/`. Those tests are separate from the smoke suite.
