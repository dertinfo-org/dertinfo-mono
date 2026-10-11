# Planned work: Website authentication integration tests

**Status:** Deferred — not scheduled yet. Capture candidates so we do not lose coverage intent after the `@auth0/auth0-angular` migration.

**App:** `apps/dert-web` (primary). Auth0 tenant + API audience settings are part of the fixture, not app code.

**Related:**

- Changelog: [`docs/operations/changelogs/2026-07-26-001-web-auth-refresh-warmup.md`](../changelogs/2026-07-26-001-web-auth-refresh-warmup.md)
- Historical silent-auth diagnosis: [`local-silent-auth-localhost.md`](../investigations/local-silent-auth-localhost.md)
- Warmup race (often coupled to auth’d dashboard load): [`web-warmup-race-condition.md`](../investigations/web-warmup-race-condition.md)
- Existing Playwright warmup scripts (may need updates): `tests/e2e/web/fixtures/fixture-2/`

---

## Why

Manual verification on `feature/web-auth-refresh-warmup` covered the main regressions (refresh race, logout 404, claim renew after create). Those behaviours should become **automated integration / e2e tests** so future Auth0 or guard changes do not reintroduce:

- Forced re-auth / consent on every full page refresh
- Stuck create modals when claim refresh fails
- Logout flashing `/session/404` before Auth0 `returnTo`

Prefer browser-level (Playwright) or API+SDK harness tests against local native stack (`:44200` web, `:44100` API, Azurite as needed) with a dedicated Auth0 test user.

---

## Already exercised manually (priority candidates)

Promote these to automated scenarios first — they matched real defects or acceptance criteria:

| # | Scenario | Pass criteria (summary) |
|---|----------|-------------------------|
| M1 | **Sign in** | Universal Login → `/callback` → authenticated dashboard (or intended target) |
| M2 | **Full page refresh** while logged in | Stay authenticated; **no** Auth0 consent / sign-in redirect (`AuthGuard` waits for `isLoading$`) |
| M3 | **Create group** | `POST /api/group/minimal` 201 → `renewToken()` (refresh grant) → modal closes / navigates to configure; new group visible without re-login |
| M4 | **Create event** | Same pattern as group for event create + claim refresh |
| M5 | **Sign out** | `/auth/signout` (“Signing out…”) → Auth0 `/v2/logout` → site **root** → `/home`; **no** `/session/404` flash |

---

## Additional candidates (long session / refresh token)

Not run as a formal suite yet; recommended when building the harness. Relies on Auth0 **access token** lifetime, **refresh token** rotation / absolute / inactivity settings.

| # | Scenario | Pass criteria (summary) |
|---|----------|-------------------------|
| S1 | **AT expiry while actively using the app** | After AT `exp`, next API call triggers `/oauth/token` (refresh) then API `200`; no login UI |
| S2 | **Idle past AT lifetime, then resume** | Same silent refresh on next navigation / data load |
| S3 | **Hard refresh after AT expired, RT still valid** | Session restored from RT; no consent screen |
| S4 | **RT expired / revoked** | Silent renew fails cleanly; user sent to sign-in (not hung spinner / 404) |
| S5 | **Refresh token rotation** | Repeated refresh grants succeed; Auth0 logs show refresh, not failed silent iframe auth |
| S6 | **Multi-tab** | Logout (or RT rotation) in one tab; other tab fails next API / recovers via sign-in |
| S7 | **File upload after AT expiry** | Upload path uses cached `dertinfo_access_token`; confirm upload still works or fails gracefully after AT lifetime (known weaker path vs interceptor) |

---

## Secondary / coupled scenarios

| # | Scenario | Notes |
|---|----------|--------|
| C1 | Cold open `/dashboard` while logged in | Warmup + auth; must not stick on `/session/warmup` |
| C2 | Deep link (e.g. dert-of-derts) while logged in | Same guard / warmup path as applicable |
| C3 | Staging / prod smoke | Same M1–M5 against non-localhost origins (consent skip rules differ from localhost) |
| C4 | **Stale authenticated session** | **Addressed** (2026-09-26). A planted Auth0 cache that can no longer renew must not leave the user on `/session/warmup`. Recovery is sign-in again, without clearing site data by hand. Script: `tests/e2e/web/tests/warmup.signed-in.rejected-cache-returns-to-sign-in.mjs` (`npm run test:login:warmup:stale-session` from `tests/e2e`). [Changelog](../changelogs/2026-09-26-002-warmup-stale-session.md) |

---

## Suggested harness notes (when implementing)

1. Browse **`:44200`** (SWA), not Angular `:4200` (CORS).
2. Assert Network: refresh uses `/oauth/token`, not `/silent` iframe `prompt=none`.
3. For S1–S3, either wait on real AT lifetime or temporarily shorten Auth0 API token lifetime in a **dev-only** tenant.
4. Seed / ensure Azurite + default images if create-group flows assert images.
5. Do not commit secrets; use `infra/secrets` / CI secrets for the Auth0 test user.

---

## Out of scope for this note

- Implementing M1–M5 and S1–S7 (deferred). C4 is covered by `tests/e2e/web/tests/warmup.signed-in.rejected-cache-returns-to-sign-in.mjs`.
- Migrating `dert-app` (PWA) auth to the same SDK (separate workstream)
- Auth0 dashboard configuration runbooks beyond what tests must assume
