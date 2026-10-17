# Dead Auth0 session leaves Warmup for sign-in

## Summary of the work completed

The website no longer stays on “Warming up” when the Auth0 browser cache looks logged in but cannot mint an access token. Warmup asks for a token before it marks the session warm or opens the dashboard. If renewal fails or does not return within 10 seconds, the saved session is cleared and the browser is sent to sign-in.

One Playwright script plants that cache against the local site and the hosted `dertinfodev` tenant. On the code before this change it stayed on `/session/warmup`. After the change the same script reaches the Auth0 sign-in page with the planted cache gone. It does not type a password.

- [Pull request 49](https://github.com/dertinfo/dertinfo-mono/pull/49) — website Warmup token check, `stale-session.mjs`, and the C4 note.

## Why the work was completed

People with a stale Auth0 session could not get past `/session/warmup`. Home, then dashboard, repeated the same screen. The only recovery was clearing local storage, cookies, and session storage by hand. `GET /api/status` does not prove the session is alive, and that call also goes through the Auth0 HTTP interceptor, so a rejected refresh token fails the kick and leaves the Warming up screen in place.

## Date the work was started

2026-09-26

## Date the work was completed

2026-09-26

## Issues that were encountered on the way

- The existing login helper writes legacy `access_token` and `id_token` keys. `@auth0/auth0-angular` ignores those. The script writes the `@@auth0spajs@@` cache the SDK reads, with an id token that has not expired and a refresh token Auth0 rejects.
- The script function passed into the browser cannot call Node helpers. The first run sent everyone to sign-in because the cache was never written. The plant function is now self-contained.
- A fast Auth0 rejection shows up as “Warmup kick failed”, not as a status 200 followed by a hung dashboard. The token check runs before the status call, so that failure clears the session. A status failure after a usable token still leaves the user on Warmup, which is the API-down case.

## References to any best practices that we found

- [Auth0 SPA SDK logout](https://auth0.com/docs/authenticate/login/logout) — `openUrl: false` clears the application session without redirecting to `/v2/logout`, so the app can then start a fresh sign-in.

## Any remaining issues that we may wish to address

- Scenarios M1–M5 and S1–S7 are [issue 114](https://github.com/dertinfo/dertinfo-mono/issues/114), including refresh-token lifetime, rotation, and upload after access-token expiry.
- `AuthGuard`, the `/session/401` page, Auth0 tenant lifetime settings, and the PWA auth SDK were not changed.
- Hosted `dev.dertinfo.co.uk` keeps the old Warmup behaviour until this website build is deployed.
