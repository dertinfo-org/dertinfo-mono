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

That command runs one fixture per feature, in dependency order, from `web/run-smoke.mjs`. Cookie consent applies `system-empty`. Each later fixture leaves the database as it is. A passing run clears `shared-session`. A failing run stops and leaves it. What the packs contain is in [tests/e2e/README.md](../../../../tests/e2e/README.md#run-configyaml).

Fixtures, in order:

1. `public.cookie-consent` — a visitor accepts cookies. This fixture applies `system-empty`.
2. `events.create` — an event administrator creates and configures an event.
3. `groups.manage` — a group administrator creates and configures a group.
4. `registration.submit` — a group administrator registers that group for the event, then amends the submitted registration.
5. `registration.confirm` — an event administrator confirms the registration.
6. `invoicing.payment-status` — the event administrator and the group administrator review the invoice.
7. `public.content` — a visitor browses the public pages.

Stay signed in is its own fixture and is left out of this command. Run it with `node web/fixtures/auth.session-continuity/run.mjs`.

The console prints `PASS` or `FAIL` for each flow. Inside a flow it prints each part as soon as that part finishes:

```text
PASS group.groupadmin.createandconfigure-scenario1 > create
PASS group.groupadmin.createandconfigure-scenario1 > add member
FAIL group.groupadmin.createandconfigure-scenario1 > change image
FAIL group.groupadmin.createandconfigure-scenario1
```

A failed part is printed before the flow itself is marked failed. The fixture then stops, so later flows do not start.

## Run one flow

Run that feature's fixture. Its `run-config.yaml` chooses the database and the form data. The fields are in [tests/e2e/README.md](../../../../tests/e2e/README.md#run-configyaml). Pass `--base-state none --clear-session false` when this fixture must keep the database and the chain already in `shared-session`.

```bash
node web/fixtures/events.create/run.mjs
node web/fixtures/registration.submit/run.mjs --base-state none --clear-session false
npm run test:web:smoke -- --event-data event2 --group-data group2
```

`--event-data` is `event1` or `event2`. `--group-data` is `group1` or `group2`. Those files are the values the flows type. The flow id chooses which scenarios run. It does not choose the form data.

Cookie consent has no predecessor, so it can run on its own against the site that is already up. Registration needs a configured group and a configured event already in the database, and the tokens still in `shared-session`. Those tokens remain when an earlier run failed.

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
- `--video` is one flag. The next word is the mode.

```bash
npm run test:web:smoke
npm run test:web:smoke -- --video errors
node web/fixtures/events.create/run.mjs --video all
```

The first command records nothing. Cookie consent applies `system-empty`, and the later fixtures leave the database as it is. The second keeps videos only for fixtures that fail. The third records the create-event fixture. Add `--base-state none` when that fixture must keep the database already in place.

Calling the runner directly has no npm separator:

```bash
node web/fixtures/public.cookie-consent/run.mjs --video errors
```

Videos for one run go in `_recordings/YYYYMMDD-HHMM/` at the repo root, using local time. Each fixture has its own subfolder, named for the feature. Clips are numbered in the order the browsers opened (`01-cookie-consent.webm`, `02-login.webm`, `03-page.webm`). A second run in the same minute uses `YYYYMMDD-HHMM-2`. After a recording run, timestamp folders older than one day are removed. An `errors` run that passes everything leaves no folder. Move a folder out of `_recordings` to keep it longer than a day. The folder is gitignored.

A flow that does several jobs in one browser produces one clip for that stretch. Sign-in, and a later actor, each open another browser and so another clip. The mapping from page calls to clips is in [Playwright standards](../standards/playwright/README.md#videos-and-steps).

## Other scripts

`npm run test:login:warmup` runs the warmup fixture at `tests/e2e/web/fixtures/fixture-2/`. Those tests are separate from the smoke suite.
