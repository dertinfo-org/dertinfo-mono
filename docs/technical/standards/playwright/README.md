---
name: Playwright standards
type: standards
status: active
updated: 2026-10-11
---

# Playwright standards

How a fixture is tied to a Gherkin feature, how a test is tied to a Gherkin scenario, and how the website smoke suite and the app fixture record video and keep session state.

Capability pages say what the product does. They keep the Gherkin and do not carry a machine-readable scenario list. This page says how a fixture runs. It is not a capability description. Commands for running the suite and turning video on are in [Website smoke tests](../../guides/website-smoke-tests.md). The mapping tables are in [tests/e2e/README.md](../../../../tests/e2e/README.md).

## Where the pieces live

| Path | Role |
|------|------|
| `tests/e2e/web/fixtures/<feature-id>/` | One website Gherkin feature. `run.mjs` is the entry point |
| `tests/e2e/app/fixtures/<feature-id>/` | One app Gherkin feature. `run.mjs` is the entry point |
| `tests/e2e/web/run-smoke.mjs` | Runs the website feature fixtures that have tests, in dependency order |
| `tests/e2e/web/fixtures/fixture-2/` | Login warmup. This is not a Gherkin feature |
| `tests/e2e/web/tests/` | Tests. Each fixture runner loads its own files |
| `tests/e2e/web/pages/` | Page objects a flow calls. The runner does not load this folder |
| `tests/e2e/web/utils/helpers.mjs` | Shared mechanics used by more than one flow |
| `tests/e2e/shared-tools/recording.mjs` | Video flag, run folders, and clip names. Website smoke and the app fixture both use this |
| `tests/e2e/shared-session/` | Cookies, persona sessions, and `chain.json` shared by the fixtures |
| `_recordings/` | Gitignored videos. Retention is in [Website smoke tests](../../guides/website-smoke-tests.md#video) |
| `tests/e2e/shared-data/logins.env` | Gitignored persona emails and passwords. `shared-tools/logins.mjs` loads this for the smoke suite and the app |
| `tests/e2e/shared-data/auth0-personas.json` | `app_metadata` to paste onto Auth0 users. Shared by the website and the app. No passwords |

## Feature and scenario

A Gherkin feature is one Playwright fixture. A Gherkin scenario is one Playwright test. The fixture runs those tests in order and records one video for the fixture.

`requires` in `run-config.yaml` names the other fixtures that must already have been run. An empty list means the fixture can run on its own. Every fixture reads and writes `tests/e2e/shared-session/`. `requires` is recorded for the order of fixtures. The runner leaves that list unchecked.

Website features live in `docs/capabilities/features/web/`. App features live in `docs/capabilities/features/app/`. The mapping table is in [tests/e2e/README.md](../../../../tests/e2e/README.md).

## How large a website smoke test is

A smoke scenario is one actor job with a useful start and a useful end. It is the whole job, in one module.

`group.groupadmin.createandconfigure-scenario1` starts with the group administrator opening the site and signing in, then creates the group, walks the configuration screens, adds a member, a guest, and a team, and replaces the gallery image. That one test still covers several Gherkin scenarios in Create and manage group. `event.eventadmin.createandconfigure-scenario1` is the same shape for Create event. Registering for the event is its own test. Amending, confirming, and reviewing invoices are separate tests in their own fixtures.

`scenario1` on the event and group tests is the collated path those fixtures still run. A second path through the same feature is another test in that fixture.

A job that is already one visit stays one scenario. `public.cookie-consent.visitor-accepts` accepts the cookie banner. `public.content.visitor-browses` walks the public pages. `auth.session-continuity.rejected-cache-returns-to-sign-in` stays in the wider set and is left out of the smoke command. Fixture order is in [Website smoke tests](../../guides/website-smoke-tests.md#run-the-suite).

## Pages

The clicks live on page objects under `tests/e2e/web/pages/`. A flow creates the page for the screen it is on and calls those methods in order. The method keeps the checks it already had. The flow owns the browser.

```js
await withPersonaPage('group-admin', async (page) => {
  const dashboard = new DashboardPage(page);
  const group = new GroupPage(page);
  await part(id, 'create', () => dashboard.createGroup(ctx));
  await part(id, 'configure', () => group.configure(ctx));
  await part(id, 'add member', () => group.addMember(ctx));
});
```

`part` prints `PASS <flow id> > <name>` when the call returns, and `FAIL <flow id> > <name>` plus the error when it throws. The flow then fails, and the runner prints `FAIL` for the scenario id.

Add a new check by adding a method on the page that owns that screen, and one `part` call. Leave the other methods as they are. Shared locators used by more than one page live in `pages/controls.mjs`. A behaviour that more than one flow needs, and that is a single job, goes in `utils/helpers.mjs`: loading a persona, opening a browser, signing in, carrying the cookie, reading the page, recognising the session-error page, and reading or writing tokens.

## Scenario id

A test that covers one Gherkin scenario is `<area>.<actor>.<action>`.

`scoring.venue-admin.signs-in` is the venue administrator signing in.

The website smoke tests that still cover several Gherkin scenarios keep their current ids, including `event.eventadmin.createandconfigure-scenario1`. The fixture for that feature is already its own folder. The id stays until the test is split into one file per scenario.

A name with no brackets is instance 1. `configuredEventId` and `configuredEventId[1]` are the same value. A second event provides `configuredEventId[2]` and does not replace the first. Omit `[n]` when there is only one.

Tokens the website smoke tests pass through `chain.json`: `cookie-consent`, `session:event-admin`, `session:group-admin`, `createdEventId`, `createdGroupId`, `configuredEventId`, `configuredGroupId`, `addedMemberId`, `addedGuestId`, `addedTeamId`, `addedIndividualActivityId`, `addedTeamActivityId`, `pendingRegistrationId`, `submittedRegistrationId`.

## Order

The fixture lists its tests and runs them in that order. It stops at the first failure, so a later test does not start. A named test id on the command runs only that test. `baseState` and `clearSession` are in [tests/e2e/README.md](../../../../tests/e2e/README.md#run-configyaml).

## Session state

These files live in `tests/e2e/shared-session/`. Every fixture uses that same folder. The files are gitignored. The README stays.

| Store | What it holds | When it is written |
|-------|----------------|--------------------|
| `sessions/cookie-consent.json` | The accepted `cookie-consent` cookie | When the site-launch scenario finishes |
| `sessions/<persona>.json` | That persona's browser storage, including the Auth0 session | When that persona's browser closes |
| `chain.json` | Tokens the tests provide (`configuredGroupId`, and the rest) | When a test calls `provide` |

Contexts use locale `en-GB` and timezone `Europe/London`.

Cookie consent runs first, in its own browser. Later browsers receive that cookie and do not click the banner. The site-launch scenario itself starts without the saved cookie, so it can accept the banner when it is on screen.

A flow that needs a signed-in actor signs in at the start, through Auth0, and stores `session:<persona>`. The work after that sign-in stays on one page for that actor. Creating a group or an event changes what the token must carry, so that flow signs in once more after the page closes and replaces the persona file. The next flow restores that file and does not sign in again.

`withPersonaPage` loads the persona file, runs the callback, writes the file again, and closes the browser. Registration restores the group-administrator file. The review flow opens a new browser each time the actor changes: group administrator, then event administrator, then group administrator again. Each of those closes by writing that persona's file.

`auth.session-continuity.rejected-cache-returns-to-sign-in` plants a rejected cache and returns to sign-in. It does not write the persona session files.

When `baseState` is not `none`, the runner applies that pack and deletes `chain.json`, so the suite does not reuse old ids. The apply leaves SQL running and does not restart the API. Persona files and the cookie file stay, and the create flows sign in again so the tokens match the empty database. `--base-state none` reads the chain already in `shared-session`.

## Videos and steps

Recording follows the browsers, which follow the actor. It does not cut a new file for each page call. Several calls on one page are one clip. The console still prints a line per part, so a failure names the part while the clip shows the whole visit.

| Browser opened by the flow | Clip name |
|----------------------------|-----------|
| Site launch | `01-cookie-consent.webm` |
| Sign-in at the start of a create flow | `01-login.webm` |
| The page that then runs that flow's page calls | `02-page.webm` |
| Sign-in after the page closes, so the saved token includes the new id | `03-login.webm` |
| Each later browser in the review flow | the next `NN-page.webm` |
| The app score-capture fixture, one browser for the feature | `01-score-capture.webm` |

Clips for one fixture share that fixture's folder under `_recordings/YYYYMMDD-HHMM/`. The folder name is the feature id, such as `events.create` or `scoring.venue-capture`. Turning recording on, and how long the folders are kept, is in [Website smoke tests](../../guides/website-smoke-tests.md#video).

## Locators

Controls the suite must find, and that have no stable accessible name, carry `data-testid`. Playwright reads that attribute with `getByTestId`. Buttons that already have a unique role and name stay on `getByRole`.

List rows and picker options also carry the id or name the scenario needs: `data-registration-id`, `data-card-title`, `data-option-name`, `data-selected`, `data-event-type`, `data-photo-name`. The signed-in shell exposes `app-ready` after warmup. The warmup screen exposes `app-warming`. The cookie banner exposes `cookie-consent` while it is open. After Accept Cookies, that element is removed. A page load accepts it when it is visible, and skips that step when it is already gone. Public pages expose `public-home`, `public-results`, `public-history`, `public-community`, `public-notations`, and `public-dertofderts`.

Do not locate rows with `ng-reflect-*`. Angular emits those attributes only in development. Do not click with `force: true`. A click waits until the control is visible and enabled.

## Test data

Form values a user would type live in `tests/e2e/shared-data/`. `groups/group1.json` and `group2.json` hold the two groups. `events/event1.json` and `event2.json` hold the two events. Keys match the database entities (`GroupName`, `GroupBio`, `GroupMembers`, `Teams`, `Activities`, and so on). Enum values use the C# names (`activeMember`, `guest`, `INDIVIDUAL`, `TEAM`, `StandardDert`). The smoke suite reads the pair named by `run-config.yaml` through `tests/e2e/shared-tools/loadData.js`.

The checked-in smoke config types `event1` and `group1`. That event is `City Zoo Gathering`. That group is `The Simpsons`. `event2` is `Ride a Giraffe`. `group2` is `The Flanders`.

Each record has an `Image` file name under `tests/e2e/shared-data/images/`. Groups use `family.jpg`. Events use `giraffe.jpg`. The stored image address stays under `originals`. The picture on the page is the `480x360` address.

## When a run fails

Correct the test when the test is wrong, and run it again. Leave the website, the API, and Auth0 unchanged when the failure is in the test. Keep the check at the strength the scenario describes.
