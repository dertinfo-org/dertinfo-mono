# Planned fix: Website warmup screen race condition

**Status:** Resolved (2026-07-26) — `WarmupGuard` owns cold→warmup redirect (no navigate-from-resolver); `WarmupComponent` recovers if already warm / kicks on init; `RepositoryBase.processApiError` fixed. See changelog [`2026-07-26-001-web-auth-refresh-warmup.md`](../changelogs/2026-07-26-001-web-auth-refresh-warmup.md). This page remains as the historical investigation.

**Follow-up (2026-09-26):** A dead Auth0 cache no longer stays on `/session/warmup`. Warmup asks for an access token before it continues, and clears the saved session and redirects to sign-in when renewal fails or times out. [Changelog](../changelogs/2026-09-26-002-warmup-stale-session.md). Scenario C4 on [`web-auth-integration-tests.md`](../planned-fixes/web-auth-integration-tests.md).

**App:** `apps/dert-web/src/client/`  
**Symptom:** User lands on `/session/warmup` (“Warming up”) and never reaches `/dashboard`, even when `/api/status` returns 200 in the network tab.

---

## Background

The website warms the API on first authenticated navigation so a cold Azure/API instance does not leave the UI unresponsive for ~40s. Implementation:

| File | Role |
|------|------|
| `app/core/services/warmup.service.ts` | Calls `GET {apiUrl}/status`, tracks warm state in memory + `sessionStorage` (`sessionwarm`), then `navigateByUrl` to the original destination |
| `app/core/resolvers/warmup.resolver.ts` | On `/dashboard` (and dert-of-derts routes): if not warm → navigate to `/session/warmup` with `skipLocationChange: true`, call `giveItAKick(state)`, return `of(false)` |
| `app/modules/session/components/warmup/warmup.component.ts` | Static “Warming up” UI — **no retry, no redirect** |

Dashboard route also resolves in parallel (after warmup passes):

- `NotificationCheckResolver` → `GET /api/notification/check`
- `DashboardResolver` → `GET /api/group` + `GET /api/event/web` (zip)

See `app/regions/authenticated/authenticated-region.routing.ts`.

---

## Root cause (investigation summary, 2026-07-01)

Two separate failure modes were reproduced against the Docker stack (`localhost:44200` web, `localhost:44100` api).

### 1. Misread “all calls OK” (auth / env)

`/api/status` is **unauthenticated**. A 200 there only means the warmup kick succeeded.

Dashboard navigation requires authenticated calls (`[Authorize]` on API). Without a valid `Auth0:ManagementClientSecret` in `infra/docker/api.env` (or user secrets when running outside Docker), or with an invalid/expired browser token, `/api/group`, `/api/event/web`, and `/api/notification/check` can return **401**. The second navigation then fails and the user remains on the warmup route.

**Interim fix (resolved for Docker):** Set **uncommented** `Auth0__ManagementClientSecret` in `infra/docker/api.env` (`ManagementClientId` is already in `appsettings.json`). See `docs/technical/infra/configuration.md`. Recreate the API container:

```bash
docker compose up -d --force-recreate dertinfo-api
```

Verify in the container: `docker exec api printenv Auth0__ManagementClientSecret` (should be non-empty).

**Debug checklist when stuck:**

1. Console: `Warmup kick succeeded` vs `Warmup kick failed`
2. Network: status codes for `/api/group`, `/api/event/web`, `/api/notification/check` (not only `/api/status`)
3. Session storage: `sessionwarm === "true"` while still on warmup ⇒ kick worked, follow-up navigation failed

### 2. Router race (deferred)

Even with all APIs returning 200, a timing race can leave the warmup UI visible:

1. User navigates to `/dashboard`
2. `WarmupResolver` starts a **competing** navigation to `/session/warmup` from inside a resolver
3. `giveItAKick` calls `GET /api/status` (async)
4. If the warmup route activation completes **before** `continueTo()` runs, and the subsequent `navigateByUrl('/dashboard')` fails or is cancelled, the user stays on `/session/warmup` with `sessionwarm` already set

Reproduced with Playwright scripts in [fixture 2](../../../tests/e2e/web/fixtures/fixture-2/description.md): delayed `/api/status` + 401 on dashboard APIs → stuck on `/session/warmup` with `sessionwarm=true`. Same delay + mocked 200s → dashboard loads.

Additional trap: **refresh or direct visit to `/session/warmup`** never calls `giveItAKick` and has no recovery — permanent dead end until manual navigation.

---

## Suggested fix direction (when revisiting)

### A. Stop navigating from inside a resolver (preferred)

Replace the resolver side-effect pattern with one of:

- **Guard + shared service:** `CanActivate` checks `WarmupService.isApiWarm()`; if cold, set a “pending destination” on the service, show warmup via a **root-level overlay** or dedicated outlet (no route change), poll `/api/status`, then navigate once warm.
- **Single navigation:** Resolver only returns a cold/warm flag; parent component or guard owns the redirect — never `router.navigate()` from `resolve()`.

Goal: one navigation at a time; no `skipLocationChange` workaround.

### B. Recovery on `WarmupComponent`

In `ngOnInit`:

- If `sessionStorage.sessionwarm` or in-memory warm flag is set → `router.navigate(['/dashboard'])` (or last intended URL stored on `WarmupService`)
- Else call `giveItAKick` with a sensible default destination (`/dashboard`)
- Optional: retry on interval if status fails

Fixes refresh/direct-URL trap with minimal change.

### C. Harden `giveItAKick` / `continueTo`

- Store intended URL on `WarmupService` when kick starts (not only `RouterStateSnapshot` from a cancelled navigation)
- Use `router.navigateByUrl(url, { replaceUrl: true })` after success
- On failure: retry with backoff or show error + link (not silent dead end)
- Subscribe with RxJS `tap`/`finalize` instead of deprecated 3-arg `subscribe`

### D. Secondary bug: `RepositoryBase.processApiError`

`apps/dert-web/src/client/src/app/core/base/repository.base.ts` uses `err.json()` which does not exist on Angular `HttpErrorResponse`. Failed dashboard API calls can throw a secondary `TypeError`, obscuring the real 401/500. Fix: `throwError(() => err.error ?? err.message ?? 'Server error')`.

---

## Test plan (after implementing race fix)

1. Cold session: clear `sessionStorage`, login, confirm reach `/dashboard` without manual refresh
2. Slow API: artificial delay on `/api/status` (2s+) with valid auth — still reach dashboard
3. Refresh on `/session/warmup` — auto-redirect or retry
4. Failed dashboard resolver (mock 401) — user sees actionable error, not infinite warmup
5. Regression: dert-of-derts routes using `WarmupResolver` (`app/regions/dertofderts/dertofderts-region.routing.ts`)

---

## Related files (quick index)

```
apps/dert-web/src/client/src/app/core/services/warmup.service.ts
apps/dert-web/src/client/src/app/core/resolvers/warmup.resolver.ts
apps/dert-web/src/client/src/app/modules/session/components/warmup/
apps/dert-web/src/client/src/app/regions/authenticated/authenticated-region.routing.ts
apps/dert-web/src/client/src/app/modules/dashboard/dashboard.resolver.ts
apps/dert-web/src/client/src/app/core/base/repository.base.ts
tests/e2e/web/fixtures/fixture-2/   # Playwright repro fixture (see description.md)
infra/docker/api.env                    # Auth0 secrets for API (gitignored)
docker-compose.yml                      # env_file: ./infra/docker/api.env
```

---

## Decision log

| Date | Decision |
|------|----------|
| 2026-07-01 | Defer race-condition refactor; unblock dashboard by fixing Docker `api.env` Auth0 management secret |
| 2026-07-01 | Dashboard reachable with `Auth0__ManagementClientSecret` in `api.env`; configuration policy documented in `docs/technical/infra/configuration.md` |
| 2026-09-26 | Stale-session Warmup stuck on hosted dev logged as planned-fix scenario C4; July race fix left in place |
