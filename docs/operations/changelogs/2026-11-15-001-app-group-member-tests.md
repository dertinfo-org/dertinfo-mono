# App group-member pin and own-team dances are covered by Playwright

## Summary of the work completed

The app now has capability pages and passing Playwright coverage for two group-member journeys. [Join a group with a pin](../../capabilities/features/app/groups-join-by-pin.md) covers the current group, an unknown pin, and joining a second group. [View own team dances](../../capabilities/features/app/results-own-team-dances.md) covers seeing only that team's dance, hidden unpublished results, and a dance for each joined group. Both are in the capability inventory and in the mapping table in [tests/e2e/README.md](../../../tests/e2e/README.md).

`npm run test:app:smoke` runs venue score capture, then `groups.join-by-pin`, then `results.own-team-dances`. The two new fixtures apply `system-basic` again because venue score capture writes scores. Each one also puts the group-member Auth0 user back to group `1` before the browser opens, because a saved pin leaves the extra group on that user. That write is described in [Auth0 Management API edits](../../technical/testing/auth0-management.md). How to start the suites is in [Testing](../../technical/testing/README.md).

The app screens those tests use now have stable hooks: header login, logout, and menu; menu items; the pin alert; profile groups; dance rows; and the hidden-results notice. The pin alert's `group-member-pin` class is only there so the test can find that alert.

With the local estate running, both fixtures passed: the three pin scenarios and the three dance scenarios.

## Why the work was completed

The app is due an Angular upgrade, and that upgrade needs a check that a group member can still sign in, join a group with its pin, and see only their own teams' dances. The product behaviour is on the capability pages. The tests follow those pages, including the temporary sign-out after a pin until [issue 149](https://github.com/dertinfo-org/dertinfo-mono/issues/149) is fixed.

## Date the work was started

2026-11-15

## Date the work was completed

2026-11-15

## Issues that were encountered on the way

- A direct request to `http://localhost:44300/home` returns "Cannot GET /home". The app tests open `/`, and Angular routes to the home page.
- A second sign-in in the same browser skips the username form and lands on the Auth0 consent screen. The login helper accepts that screen.
- Ionic keeps the previous page in the DOM, so the header menu button matched two elements after a dance was opened. Login, logout, and menu use the visible header.
- Saving a valid pin adds that group to the Auth0 user's `groupmember` claim, and reloading `system-basic` does not remove it. The two group-member fixtures set the claim back to `["1"]` with the Management API before they start. Replacing that direct call is [issue 150](https://github.com/dertinfo-org/dertinfo-mono/issues/150).
- Starting the API from the agent session hit Windows application control (`0x800711C7`, "An Application Control policy has blocked this file") on `DertInfo.Api.dll`. The estate was started in a local terminal, and the six tests then passed.

## References to any best practices that we found

- [Playwright locators](https://playwright.dev/docs/locators) — `data-testid` where the accessible name was brittle, and one visible header when Ionic keeps the previous page.
- [GitHub Flow](https://docs.github.com/en/get-started/using-github/github-flow) — this work is on a branch for a pull request into `main`.
- [Documentation guide](../../documentation-guide.md) — the capability pages stay implementation-free. The Auth0 Management API write lives under technical testing.
- [Testing](../../technical/testing/README.md) — suite commands, layout, and what a run may change.
- [Auth0 Management API](https://auth0.com/docs/api/management/v2) — the test reset uses a client-credentials token and patches one user's `app_metadata`.

## Any remaining issues that we may wish to address

- [Issue 149](https://github.com/dertinfo-org/dertinfo-mono/issues/149) — a saved pin does not show on the open sign-in. The join tests sign out and back in until that is fixed. The Angular upgrade comes first.
- [Issue 150](https://github.com/dertinfo-org/dertinfo-mono/issues/150) — a member can leave a group, and the end-to-end suite then stops calling the Auth0 Management API itself.
