---
title: Login warmup
type: fixture
status: active
updated: 2026-10-11
id: web.fixture-2
summary: A signed-in user with a planted session opens the website and exercises the warmup screen after login.
state: run-config.yaml
baseState: none
scenarios:
  - ../../tests/warmup.signed-in.records-full-flow.mjs
  - ../../tests/warmup.signed-in.sticks-on-slow-status.mjs
  - ../../tests/warmup.signed-in.reaches-dashboard.mjs
  - ../../tests/warmup.signed-in.stays-after-refresh.mjs
  - ../../tests/warmup.signed-in.records-url-history.mjs
  - ../../tests/warmup.signed-in.compares-hang-with-auth-failure.mjs
separate:
  - ../../tests/warmup.signed-in.rejected-cache-returns-to-sign-in.mjs
session: ../../../shared-tools/session.mjs
---

# Login warmup

## Summary

These tests cover authenticated access on the website after a session has been planted. They do not drive the Auth0 login screen. They seed `localStorage` with a fake token so the auth guard passes, then exercise `/session/warmup`, the warmup resolver, and navigation to `/dashboard` after `GET /api/status`.

## Synopsis

[run-config.yaml](run-config.yaml) sets `baseState` to `none`, so a run uses the website and API that are already up and does not change the database. [run.mjs](run.mjs) is the entry point. It runs the tests below in investigation order. Runtime files for the run go in [run-state](run-state). A passing run removes them when `clearSession` is true. A failing run leaves them.

The planted session comes from [session.mjs](../../../shared-tools/session.mjs). The website must be on `http://localhost:44200` and the API on `http://localhost:44100`.

| Test | What it does |
|------|----------------|
| [warmup.signed-in.records-full-flow](../../tests/warmup.signed-in.records-full-flow.mjs) | Full flow. Logs API calls and the console |
| [warmup.signed-in.sticks-on-slow-status](../../tests/warmup.signed-in.sticks-on-slow-status.mjs) | Delayed `/api/status` plus a 401 leaves the user on the warmup screen |
| [warmup.signed-in.reaches-dashboard](../../tests/warmup.signed-in.reaches-dashboard.mjs) | The same delay with mocked 200 responses reaches the dashboard |
| [warmup.signed-in.stays-after-refresh](../../tests/warmup.signed-in.stays-after-refresh.mjs) | A direct visit to `/session/warmup` does not recover |
| [warmup.signed-in.records-url-history](../../tests/warmup.signed-in.records-url-history.mjs) | Address bar timeline during warmup |
| [warmup.signed-in.compares-hang-with-auth-failure](../../tests/warmup.signed-in.compares-hang-with-auth-failure.mjs) | Auth failure against a hung resolver |

[warmup.signed-in.rejected-cache-returns-to-sign-in](../../tests/warmup.signed-in.rejected-cache-returns-to-sign-in.mjs) plants a dead Auth0 cache and checks that the browser leaves the warmup screen for sign-in. It is not part of the default run.

Suggested order when investigating: the full flow, then the slow-status case, then the dashboard control, then the refresh dead-end, then the hang comparison.

From `tests/e2e`:

```bash
npm run test:login:warmup
npm run test:login:warmup:baseline
npm run test:login:warmup:mid-race
npm run test:login:warmup:delay-control
npm run test:login:warmup:refresh-trap
npm run test:login:warmup:url-history
npm run test:login:warmup:hang-vs-auth
npm run test:login:warmup:stale-session
```

Real Auth0 redirect and silent token refresh are not part of this fixture.

Related: [warmup race investigation](../../../../../docs/operations/investigations/web-warmup-race-condition.md) and [configuration](../../../../../docs/technical/infra/configuration.md).
