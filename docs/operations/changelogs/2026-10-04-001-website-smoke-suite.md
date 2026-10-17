# Reliable website smoke suite

## Summary of the work completed

The website smoke suite now runs as a few start-to-end flows, from a clean Docker SQL database, with stable locators and optional video. `npm run test:web:smoke` runs cookie consent, creating and configuring an event, creating and configuring a group, registering that group, reviewing the registration and invoices, and a public browse. Each flow reuses the earlier step functions and prints each part as it passes or fails. `--video all` or `--video errors` records the browsers those flows open. How to run it is in [Website smoke tests](../../technical/guides/website-smoke-tests.md). How a scenario is built is in [Playwright standards](../../technical/standards/playwright/README.md).

## Why the work was completed

The first smoke pass worked and was brittle: repeated runs found duplicate group names, clicks landed on covered Material controls, and each small check opened a new browser. Collating those checks into actor flows keeps the known clicks, shortens the suite, and makes a recording one visit rather than a series of restarts. Video stays off until it is asked for, so a normal run does not fill the disk.

## Date the work was started

2026-09-27

## Date the work was completed

2026-10-04

## Issues that were encountered on the way

- The first database reset only removed the Compose volume `sqlserver-data`. A manually created container was already publishing port `44000`, so Compose could not bind that port. The reset now removes whichever container publishes `44000`, and its SQL volume, before starting Compose SQL Server.
- The group gallery starts with a default image. An upload replaces that image, so a check that waited for a second tile failed after a successful upload. The check now waits until a gallery image address changes.
- After Auth0 returned to the site, a consent click matched the cookie banner's Accept Cookies button, which sits under the signed-in navigation. Consent is clicked only while the browser is still on Auth0.
- The event picture stored on the form stays under `originals`. The image shown on the page uses the `480x360` address. The configure step waits for that shown address.
- An empty public history page has no height, so its marker looks hidden. That showed up when event configuration had not finished. A full run that configures the event renders the history page.

## References to any best practices that we found

- [Playwright locators](https://playwright.dev/docs/locators) — prefer role, label, and test id, and wait for the control to be actionable.
- [Locate by test id](https://playwright.dev/docs/locators#locate-by-test-id) — `data-testid` for controls that have no stable accessible name.
- [GitHub Flow](https://docs.github.com/en/get-started/using-github/github-flow) — this work is on a branch for a pull request into `main`.
- [Website smoke tests](../../technical/guides/website-smoke-tests.md) — how to run the suite and record video.
- [Playwright standards](../../technical/standards/playwright/README.md) — scenario size, steps, session files, and how browsers become clips.

## Any remaining issues that we may wish to address

- The cookie banner can sit under the signed-in navigation, so the site can be used without accepting it. Noted in [issue 93](https://github.com/dertinfo/dertinfo-mono/issues/93). The suite accepts the banner on launch and carries that cookie forward.
- `auth.session-continuity.rejected-cache-returns-to-sign-in` stays out of the default smoke command. Pass its id to run it.
- Capability scenarios that never had a module remain documentation. A `coveredBy` entry records which flow now performs a behaviour the suite used to run as its own scenario.
