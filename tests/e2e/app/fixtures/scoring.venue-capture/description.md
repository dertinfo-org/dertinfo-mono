---
title: Venue score capture
type: fixture
status: active
updated: 2026-10-11
id: scoring.venue-capture
summary: A venue administrator signs in on the app and completes score capture for the first dance that is still awaiting scores.
state: run-config.yaml
baseState: ../../../shared-state/system-basic
feature: ../../../../docs/capabilities/features/app/venue-score-capture.md
scenarios:
  - ../../tests/scoring.venue-admin.signs-in.mjs
  - ../../tests/scoring.venue-admin.opens-first-dance.mjs
  - ../../tests/scoring.venue-admin.rejects-out-of-range-score.mjs
  - ../../tests/scoring.venue-admin.sends-scores.mjs
  - ../../tests/scoring.venue-admin.photographs-score-sheets.mjs
  - ../../tests/scoring.venue-admin.confirms-dance-completed.mjs
  - ../../tests/scoring.venue-admin.confirms-scores-and-photos.mjs
logins: ../../../shared-data/logins.env.example
---

# Venue score capture

This fixture is the [Venue score capture](../../../../docs/capabilities/features/app/venue-score-capture.md) feature. Each test in the front matter is one scenario from that page. It runs on one signed-in session against [system-basic](../../../shared-state/system-basic) and records one video.

The screen is the iPhone SE size in [device.mjs](../../config/device.mjs), so the side menu is opened from the header before Venue or Dances. The venue administrator email and password are `DERTINFO_E2E_VENUE_ADMIN_EMAIL` and `DERTINFO_E2E_VENUE_ADMIN_PASSWORD` in [logins.env](../../../shared-data/logins.env.example).
