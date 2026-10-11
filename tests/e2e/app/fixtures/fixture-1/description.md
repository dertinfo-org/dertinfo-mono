---
title: App core functionality
type: fixture
status: active
updated: 2026-10-11
id: app.fixture-1
summary: A venue administrator signs in on the app and completes score capture for the first dance that is still awaiting scores.
state: run-config.yaml
baseState: ../../../shared-state/system-basic
scenario: ../../tests/scoring.venue-capture.enter-scores.mjs
feature: ../../../../docs/capabilities/features/venue-score-capture.md
logins: ../../../shared-data/logins.env.example
---

# App core functionality

## Summary

The app is opened against the shared `system-basic` database. A venue administrator signs in and completes score capture for whichever dance is first in the expected list.

## Synopsis

[run.mjs](run.mjs) is the entry point for this fixture. It runs [scoring.venue-capture.enter-scores](../../tests/scoring.venue-capture.enter-scores.mjs), which covers [venue score capture](../../../../../docs/capabilities/features/venue-score-capture.md). Runtime files for the run go in [run-state](run-state). A run that passes removes them. A run that fails leaves them.

The database comes from [system-basic](../../../shared-state/system-basic). [run-config.yaml](run-config.yaml) records that choice, records nothing, and clears [run-state](run-state) after a passing run. The venue administrator email and password are `DERTINFO_E2E_VENUE_ADMIN_EMAIL` and `DERTINFO_E2E_VENUE_ADMIN_PASSWORD` in [logins.env](../../../shared-data/logins.env.example).

The run signs in on the app, opens the first venue, and opens the first dance still listed under Expected Dances. It enters a score above that category's maximum, checks that the field is marked invalid and that Send Scores stays disabled, then enters a valid mark for every category and sends them. It takes two score-sheet photos through the app camera. Each photo must appear as the resized `480x360` image. Back on the dance list, that dance is under Completed Dances. Opening it again shows the same marks and both photos.

Each run applies [system-basic](../../../shared-state/system-basic) before the scenario, from `tests/e2e`, unless `--base-state none` is passed:

```bash
npm run test:app:core
npm run test:app:core -- --video all
npm run test:app:core -- --video errors
```

`--video` is the same flag as the [website smoke suite](../../../../../docs/technical/guides/website-smoke-tests.md#video). `all` keeps the clip. `errors` keeps it only when the scenario fails. The default records nothing. The clip is `01-score-capture.webm` under `_recordings/YYYYMMDD-HHMM/scoring.venue-capture.enter-scores/` at the repo root.

The app must already be up at `http://localhost:44300`, with the API and image resize running. The screen is an iPhone 5, 320 by 568, so the side menu is opened from the header before Venue or Dances.
