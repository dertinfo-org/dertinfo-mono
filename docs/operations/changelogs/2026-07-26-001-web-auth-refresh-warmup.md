# Website Auth0 refresh tokens and warmup race fix

## Summary of the work completed

Fixed two related **web-only** (`apps/dert-web`) issues on localhost:

1. **Post–group-create silent auth** — `auth0-js` `renewAuth` iframe failed with Auth0 `consent_required` on `http://localhost:44200`, leaving the create-group modal stuck.
2. **Warmup race** — navigation from inside `WarmupResolver` could leave users on `/session/warmup`.

**Auth:** Migrated the website to `@auth0/auth0-angular@2.2.3` (pinned; newer 2.x needs Angular 15+). Login uses Authorization Code + PKCE with `offline_access`, `useRefreshTokens: true`, `useRefreshTokensFallback: false`, and `cacheLocation: 'localstorage'`. `renewToken()` now calls `getAccessTokenSilently({ cacheMode: 'off' })` (refresh-token grant) instead of the `/silent` iframe. Removed the silent callback component; `/silent` redirects to `/callback` for safety. `ConfigurationService` loads bootstrap config via `HttpBackend` so `AuthHttpInterceptor` cannot deadlock `APP_INITIALIZER`. Staging/prod share the same SDK path; only callback/API bases differ.

**Warmup:** Added `WarmupGuard` (`CanActivate`) to own cold→`/session/warmup` redirect; deprecated the resolver side-effect. `WarmupService` stores a pending URL and continues with `replaceUrl`. `WarmupComponent` recovers if already warm or kicks on init. Fixed `RepositoryBase.processApiError` (`err.error` instead of non-existent `err.json()`).

**UX hardening:** Group/event create now rejects on API failure and resets `isSubmitting` so the submit button does not stay disabled forever.

Verified locally on `http://localhost:44200`: login → dashboard, create group → modal closes → navigate to group-configure with updated nav claims (no re-login).

Branch: `feature/web-auth-refresh-warmup` (uncommitted at changelog write time; no PR yet).

## Date the work was started

2026-07-25

## Date the work was completed

2026-07-26

## Issues that were encountered on the way

1. **`@auth0/auth0-angular` 2.11.x** — pulls `makeEnvironmentProviders` / `EnvironmentProviders` (Angular 15+). Resolved by pinning **2.2.3** and enabling `skipLibCheck` for `oauth4webapi` under TypeScript 4.8.
2. **APP_INITIALIZER deadlock** — `AuthHttpInterceptor` blocked config HTTP until Auth0 was configured. Fixed by loading local/remote config through `HttpBackend`.
3. **CORS / wrong origin** — browse **`:44200`** (SWA), not Angular `:4200`; API only allows the SWA origins.
4. **False “web healthy”** — orchestrator can report web up when SWA returns non-500; confirm real HTML/login.
5. **Verification blockers (env, not auth code)** — API process down; Azurite off caused `POST /api/group/minimal` 500 (storage on `:10000` refused). Enable Azurite in `infra/dev/runtime.json` for group create. SQL login/permissions must allow migrations/connect (doctor).
6. **Auth0 consent prompts** — first-party consent may still appear until the user Accepts once for `offline_access` / API audience; enable skipping consent for first-party clients where Auth0 allows it (localhost still special-cased for *silent iframe*, which this migration avoids).
7. **CDP `Page.reload`** — interrupts the Cursor browser agent session; use `browser_navigate` to refresh instead.

## References to any best practices that we found

- Prefer **refresh tokens** over silent iframe renewal on localhost; Auth0 does not skip consent for `http://localhost` silent auth — see [Skipping consent for first-party clients](https://auth0.com/docs/api-auth/user-consent#skipping-consent-for-first-party-clients) and prior diagnosis in [`docs/operations/investigations/local-silent-auth-localhost.md`](../investigations/local-silent-auth-localhost.md).
- Do **not** navigate from Angular `Resolve` guards for side-effect redirects; use `CanActivate` + a pending-URL service ([`docs/operations/investigations/web-warmup-race-condition.md`](../investigations/web-warmup-race-condition.md)).
- Bootstrap config HTTP must bypass interceptors (`HttpBackend`) when the interceptor depends on that config.
- Pin SDK majors carefully against the Angular version in `apps/dert-web` (Angular 14).
- Local estate: [`docs/technical/infra/configuration.md`](../../technical/infra/configuration.md), [`infra/dev/README.md`](../../../infra/dev/README.md) — API + web + Azurite for group/image flows.

## Any remaining issues that we may wish to address

- Commit and open a PR from `feature/web-auth-refresh-warmup` when ready.
- Confirm Auth0 Application / API settings for refresh-token rotation and first-party consent skip on staging/prod (dashboard changes are manual).
- Consider migrating **`dert-app` (PWA)** to the same Auth0 Angular SDK later for consistency (PWA was not broken the same way on localhost).
- Optional: Auth0 “Allow Skipping User Consent” / reduce repeated consent screens during local testing.
- Playwright warmup e2e under `tests/e2e/web/fixtures/fixture-2/` may need updates for `WarmupGuard` behaviour.
- Staging/prod smoke of login + group create after deploy.
- **Integration / e2e coverage for auth behaviours** (refresh, logout, long-session token renew, etc.) — [issue 114](https://github.com/dertinfo/dertinfo-mono/issues/114).
