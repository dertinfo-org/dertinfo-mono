# Homepage account shows a signed-in visitor

## Summary of the work completed

The website homepage shows **Register** and **Login** when there is no active session. When the saved session is still active, it shows that person's picture instead. The picture opens the same account menu used on signed-in pages: the email address, a horizontal line, then **Dashboard**, **My account**, and **Log out**, each with an icon. The homepage reads the session already in the browser and does not wait on a new token before painting. The capability is [Homepage account](../../capabilities/features/web/homepage-account.md).

## Why the work was completed

Visitors who are already signed in should see that on the public homepage and be able to open the dashboard, their account, or log out without hunting through the site. Visitors whose session is no longer active should still see **Register** and **Login**. The signed-in toolbar had a different menu (Profile, Account Settings, Sign out), so the two places now share one menu.

## Date the work was started

2026-10-11

## Date the work was completed

2026-10-11

## Issues that were encountered on the way

Opening the site as `127.0.0.1` left the page on the loading spinner because the API configuration request is to `localhost`. The same homepage loaded at `http://localhost:44200`. The account menu first opened to the right of the toolbar picture and sat off the edge of the window. It now opens to the left of the picture.

## References to any best practices that we found

- [Documentation guide](../../documentation-guide.md) — a capability is a markdown page plus a row in `capabilities.yaml`, and Gherkin stays on the feature page.
- [Dead Auth0 session leaves Warmup for sign-in](./2026-09-26-002-warmup-stale-session.md) — a saved session that cannot mint a token is not treated as signed in.

## Any remaining issues that we may wish to address

- The Gherkin scenarios on [Homepage account](../../capabilities/features/web/homepage-account.md) do not have Playwright tests yet, so they are not in the [e2e feature mapping](../../../tests/e2e/README.md).
- A full page load can still ask Auth0 for a new token from the existing signed-in client. The homepage does not wait for that request. If it succeeds, the picture replaces **Register** and **Login**.
