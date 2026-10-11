---
name: Playwright standards
type: standards
status: active
updated: 2026-10-04
---

# Playwright standards

How a website smoke scenario is built: how large it is, how it calls steps, how those browsers become videos, and how session state is kept.

Capability pages say what the product does. This page says how a smoke scenario is wired to those pages. It is not a capability description. Commands for running the suite and turning video on are in [Website smoke tests](../../guides/website-smoke-tests.md).

## Where the pieces live

| Path | Role |
|------|------|
| `tests/e2e/web/smoke/scenarios/` | One module per smoke flow. The runner loads these |
| `tests/e2e/web/smoke/steps/` | Page actions a flow calls, in order. The runner does not load this folder |
| `tests/e2e/web/smoke/scenarios/run.mjs` | Reads feature contracts and runs the suite |
| `tests/e2e/web/smoke/helpers.mjs` | Shared mechanics used by more than one flow |
| `tests/e2e/web/smoke/recording.mjs` | Video flag, run folders, and clip names. The app core fixture uses this too |
| `tests/e2e/web/smoke/state/` | Gitignored session files and the chain of provided tokens |
| `_recordings/` | Gitignored videos. The three newest timestamp folders are kept |
| `tests/e2e/.env` | Gitignored persona emails and passwords |
| `tests/e2e/auth0-personas.json` | `app_metadata` to paste onto Auth0 users. No passwords |

## How large a scenario is

A smoke scenario is one actor job with a useful start and a useful end. It is the whole job, in one module.

`group.groupadmin.createandconfigure-scenario1` starts with the group administrator opening the site and signing in, then creates the group, walks the configuration screens, adds a member, a guest, and a team, and replaces the gallery image. That is one scenario. `event.eventadmin.createandconfigure-scenario1` is the same shape for an event. Registration is its own scenario, so it can run when the group and the event are already in the database. Seeing the registration, amending it, confirming it, and reading the invoices is another scenario, because that job starts from a submitted registration.

`scenario1` is the path the smoke command runs. `scenario2` would be a different path through the same job, such as a second way to configure a group. It is a different module. The smoke command runs `scenario1`.

A job that is already one visit stays one scenario. `public.cookie-consent.visitor-accepts` accepts the cookie banner. `public.content.visitor-browses` walks the public pages. `auth.session-continuity.rejected-cache-returns-to-sign-in` stays in the wider set and is left out of the smoke command.

The current smoke scenarios, in run order:

| Scenario | Start | End |
|----------|-------|-----|
| `public.cookie-consent.visitor-accepts` | Site launch | Cookie stored |
| `event.eventadmin.createandconfigure-scenario1` | Event administrator signs in | Event configured, with activities |
| `group.groupadmin.createandconfigure-scenario1` | Group administrator signs in | Group configured, with people, a team, and a new gallery image |
| `registration.groupadmin.registerforevent-scenario1` | Saved group-administrator session, group and event already exist | Registration submitted |
| `registration.groupadmin.checkregistrationandedit-scenario1` | Submitted registration | Amended, confirmed, invoices reviewed |
| `public.content.visitor-browses` | Public home | Public pages have rendered |

## Steps

The clicks that used to be their own scenarios live in `tests/e2e/web/smoke/steps/`. A flow calls those functions in order on one page. The step function keeps the checks it already had. The flow owns the browser.

```js
await withPersonaPage('group-admin', async (page) => {
  await part(id, 'create', () => createGroup(page, ctx));
  await part(id, 'configure', () => configureGroup(page, ctx));
  await part(id, 'add member', () => addGroupMember(page, ctx));
});
```

`part` prints `PASS <flow id> > <name>` when the step returns, and `FAIL <flow id> > <name>` plus the error when it throws. The flow then fails, and the runner prints `FAIL` for the scenario id.

Add a new check by adding a step function and one `part` call. Leave the other step functions as they are. A behaviour that belongs to one flow stays in `steps/`. A behaviour that more than one flow needs, and that is a single job, goes in `helpers.mjs`: loading a persona, opening a browser, signing in, carrying the cookie, reading the page, recognising the session-error page, and reading or writing tokens.

## Scenario id

A collated flow is `<area>.<actor>.<action>-scenarioN`.

`group.groupadmin.createandconfigure-scenario1` is the group administrator creating and configuring one group.

A flow that is still a single behaviour keeps `<feature id>.<actor>-<verb>`. `public.content.visitor-browses` is a visitor browsing public pages.

The scenario id is never given a `[n]` suffix. The action name stays the same when a second object is created. The path number is `-scenarioN`. `[n]` on a token is an instance number, described under Contracts.

## Contract

Each feature page that the smoke suite covers has a `## Scenarios` section. Gherkin (Given, When, Then, And, But) stays in one block. The runner does not read those sentences. The behaviour stays written at that grain even when one flow now performs several of those behaviours.

The runner reads the YAML contract on that page:

```yaml
scenarios:
  - id: event.eventadmin.createandconfigure-scenario1
    persona: event-admin
    sequence: 20
    requires:
      - public.cookie-consent.visitor-accepts
    provides:
      - configuredEventId
      - addedIndividualActivityId
      - addedTeamActivityId
  - id: events.create.event-admin-creates
    persona: event-admin
    sequence: 20
    requires:
      - auth.login.event-admin
    provides:
      - createdEventId
    coveredBy: event.eventadmin.createandconfigure-scenario1
```

`persona` must be one of the feature's `roles`. `requires` names other scenario ids. `provides` names the tokens that scenario leaves behind. `sequence` is only a tie-break when `requires` does not decide the order. Lower numbers run first.

`coveredBy` names the flow that now performs that behaviour. The runner does not execute a `coveredBy` entry. The flow's own YAML, without `coveredBy`, is the contract that runs. Capability pages that never had a module stay documentation only.

A name with no brackets is instance 1. `configuredEventId` and `configuredEventId[1]` are the same value. A second event provides `configuredEventId[2]` and does not replace the first. A later scenario requires that second flow when it must use the second event. Omit `[n]` when there is only one.

Provided names in this suite: `cookie-consent`, `session:event-admin`, `session:group-admin`, `createdEventId`, `createdGroupId`, `configuredEventId`, `configuredGroupId`, `addedMemberId`, `addedGuestId`, `addedTeamId`, `addedIndividualActivityId`, `addedTeamActivityId`, `pendingRegistrationId`, `submittedRegistrationId`.

## Prerequisites

On a full smoke run, the first action of a scenario checks that every required scenario has passed in this run and that its tokens are present. The check does nothing else.

When they are present, the scenario continues. When any are missing, the scenario fails immediately with `prerequisites not available` and the missing ids or tokens. Its own steps do not run.

A named scenario id is the exception. It does not re-run the flows it requires. It continues when those flows' tokens are already in the chain, and it fails the same way when they are not. That invocation does not reset the database.

Leave a `requires` entry in place when a later scenario needs that token. Fix the scenario that should have provided it.

## Session state

Three stores sit under `tests/e2e/web/smoke/state/`. All of them are gitignored.

| Store | What it holds | When it is written |
|-------|----------------|--------------------|
| `sessions/cookie-consent.json` | The accepted `cookie-consent` cookie | When the site-launch scenario finishes |
| `sessions/<persona>.json` | That persona's browser storage, including the Auth0 session | When that persona's browser closes |
| `chain.json` | Tokens the scenarios provide (`configuredGroupId`, and the rest) | As each scenario calls `provide`, and again when the scenario passes |

Contexts use locale `en-GB` and timezone `Europe/London`.

Cookie consent runs first, in its own browser. Later browsers receive that cookie and do not click the banner. The site-launch scenario itself starts without the saved cookie, so it can accept the banner when it is on screen.

A flow that needs a signed-in actor signs in at the start, through Auth0, and stores `session:<persona>`. The work after that sign-in stays on one page for that actor. Creating a group or an event changes what the token must carry, so that flow signs in once more after the page closes and replaces the persona file. The next flow restores that file and does not sign in again.

`withPersonaPage` loads the persona file, runs the callback, writes the file again, and closes the browser. Registration restores the group-administrator file. The review flow opens a new browser each time the actor changes: group administrator, then event administrator, then group administrator again. Each of those closes by writing that persona's file.

`auth.session-continuity.rejected-cache-returns-to-sign-in` plants a rejected cache and returns to sign-in. It does not write the persona session files.

A full smoke run deletes `chain.json` after it has recreated the database. Persona files and the cookie file stay, and the create flows sign in again so the tokens match the empty database. A named flow leaves the chain and the database as they are.

## Videos and steps

Recording follows the browsers, which follow the actor. It does not cut a new file for each step. Several steps on one page are one clip. The console still prints a line per step, so a failure names the step while the clip shows the whole visit.

| Browser opened by the flow | Clip name |
|----------------------------|-----------|
| Site launch | `01-cookie-consent.webm` |
| Sign-in at the start of a create flow | `01-login.webm` |
| The page that then runs that flow's steps | `02-page.webm` |
| Sign-in after the page closes, so the saved token includes the new id | `03-login.webm` |
| Each later browser in the review flow | the next `NN-page.webm` |

Clips for one flow share that flow's folder under `_recordings/YYYYMMDD-HHMM/`. `errors` mode deletes a flow's folder when that flow passes. `all` keeps every clip. Turning recording on, and where the folders go, is in [Website smoke tests](../../guides/website-smoke-tests.md#video).

## Locators

Controls the suite must find, and that have no stable accessible name, carry `data-testid`. Playwright reads that attribute with `getByTestId`. Buttons that already have a unique role and name stay on `getByRole`.

List rows and picker options also carry the id or name the scenario needs: `data-registration-id`, `data-card-title`, `data-option-name`, `data-selected`, `data-event-type`, `data-photo-name`. The signed-in shell exposes `app-ready` after warmup. The warmup screen exposes `app-warming`. The cookie banner exposes `cookie-consent` while it is open. After Accept Cookies, that element is removed. A page load accepts it when it is visible, and skips that step when it is already gone. Public pages expose `public-home`, `public-results`, `public-history`, `public-community`, `public-notations`, and `public-dertofderts`.

Do not locate rows with `ng-reflect-*`. Angular emits those attributes only in development. Do not click with `force: true`. A click waits until the control is visible and enabled.

## Test data

Smoke data lives in `tests/e2e/web/smoke/config/`. `groups.json` holds two groups. `events.json` holds two events. Keys match the database entities (`GroupName`, `GroupBio`, `GroupMembers`, `Teams`, `Activities`, and so on). Enum values use the C# names (`activeMember`, `guest`, `INDIVIDUAL`, `TEAM`, `StandardDert`).

The current scenarios enter the first group and the first event. Groups are named for The Simpsons. Events are named for a zoo. The first group is `The Simpsons`. The first event is `City Zoo Gathering`.

Each record has an `Image` file name under `tests/e2e/web/smoke/fixtures/`. Groups use `family.jpg`. Events use `giraffe.jpg`. The stored image address stays under `originals`. The picture on the page is the `480x360` address.

## When a run fails

Correct the test when the test is wrong, and run it again. Leave the website, the API, and Auth0 unchanged when the failure is in the test. Keep the check at the strength the scenario describes.
