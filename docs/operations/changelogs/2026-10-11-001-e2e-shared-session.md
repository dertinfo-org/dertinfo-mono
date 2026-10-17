# End-to-end fixtures share a session and match Gherkin features

## Summary of the work completed

The Playwright estate under `tests/e2e` now has one layout for the website and the app. A Gherkin feature is one fixture. A Gherkin scenario is one test, except the create-event, create-group, and register-for-event tests, which still cover several scenarios each. Website fixtures live under `web/fixtures/<feature-id>/`. The app score-capture fixture is `app/fixtures/scoring.venue-capture/`. `web/run-smoke.mjs` runs the website fixtures that have tests, in dependency order.

Four shared folders sit beside those suites. `shared-data` holds form values, images, and Auth0 personas. `shared-state` holds the SQL packs (`system-empty`, `system-basic`) and `apply.mjs`. `shared-session` holds the cookie, persona sessions, and `chain.json` that every fixture reads and writes. `shared-tools` holds recording, `run-config.yaml` loading, the website fixture runner, and login loading. Per-fixture `run-state` folders are gone.

Capability features are split into `docs/capabilities/features/web/` and `docs/capabilities/features/app/`. Gherkin stays on those pages. The machine-readable scenario blocks were removed. The feature and scenario mapping tables are in [tests/e2e/README.md](../../../tests/e2e/README.md). How to run the suite is in [Website smoke tests](../../technical/guides/website-smoke-tests.md). How a page object and the session work is in [Playwright standards](../../technical/standards/playwright/README.md).

On the website, accepting cookies now stores that choice for one year, and the cookie policy says so. The public homepage header no longer has a single **My Dashboard** button. It now has a site menu and two account buttons. The menu is a navigation bar labelled Site, and its first item is **Results**, which opens the public results page. **Sign up** is an outlined button and asks Auth0 to open the sign-up screen. **Sign in** is a filled button and goes to the dashboard, which starts sign-in when the visitor is not already signed in. The score-checking list and the venue judge dialog use layout classes for their fields.

`npm run test:web:smoke` passed after the shared session was in place: cookie consent, create event, manage group, submit and amend registration, confirm registration, both invoice reviews, and the public browse.

## Why the work was completed

The smoke suite and the new app score-capture journey needed the same shape, and they needed to follow one another without each fixture keeping a private copy of the database ids. A feature folder with `description.md`, `run-config.yaml`, and `run.mjs` makes that shape obvious. Sharing one session folder means the event id and the group id written by an earlier fixture are the ones the next fixture reads. Putting Gherkin on the capability pages, and the fixture map in the e2e README, keeps the product description separate from how the tests are run.

## Date the work was started

2026-10-11

## Date the work was completed

2026-10-11

## Issues that were encountered on the way

- Cookie acceptance was stored as a session cookie, so a later browser in the suite saw the banner again. Acceptance is now stored for 365 days with path `/` and `SameSite=Lax`.
- Applying a SQL pack failed when `IDENTITY_INSERT` and the inserts were not in the same batch. `shared-state/apply.mjs` sends them together. The pack deletes fixture rows and leaves system settings and migration history. It does not drop the database or restart the API.
- While each fixture still had its own `run-state`, registration opened a group id left over from an earlier run, and invoicing opened an event id that the confirm fixture had never written. The suite stopped on the Available / New tab, then again on the invoices header. Sharing `tests/e2e/shared-session` removed that copy. Smoke clears that folder at the start and again when every fixture passes.
- At the app's iPhone SE width the side menu is hidden until the header menu button is used. The score-capture page objects open it that way.

## References to any best practices that we found

- [Playwright locators](https://playwright.dev/docs/locators) — role, label, and test id, and wait until the control is actionable.
- [GitHub Flow](https://docs.github.com/en/get-started/using-github/github-flow) — this work is on a branch for a pull request into `main`.
- [Documentation guide](../../documentation-guide.md) — capability pages stay implementation-free. Website features are under `features/web/`. App features are under `features/app/`.
- [Website smoke tests](../../technical/guides/website-smoke-tests.md) — how to run `web/run-smoke.mjs` and record video.
- [Playwright standards](../../technical/standards/playwright/README.md) — page objects, tokens, and clip names.

## Any remaining issues that we may wish to address

- `requires` in `run-config.yaml` names the fixtures that should already have been run. The runner records that list and does not check it.
- `event.eventadmin.createandconfigure-scenario1`, `group.groupadmin.createandconfigure-scenario1`, and `registration.groupadmin.registerforevent-scenario1` each still cover several Gherkin scenarios. The mapping table lists a scenario only when the test is that scenario alone.
- Stay signed in is `web/fixtures/auth.session-continuity/` and is left out of `npm run test:web:smoke`. Login warmup stays `web/fixtures/fixture-2/` because it is not a Gherkin feature.
- Notes recorded beside this work, and not done here: [remove legacy auth tables](https://github.com/dertinfo/dertinfo-mono/issues/110), [remove unused system settings](https://github.com/dertinfo/dertinfo-mono/issues/111), and [decouple Auth0 ids from the database](https://github.com/dertinfo/dertinfo-mono/issues/112).
