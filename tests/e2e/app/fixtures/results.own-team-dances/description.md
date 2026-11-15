---
title: View own team dances
type: fixture
status: active
updated: 2026-11-15
id: results.own-team-dances
summary: A group member sees only their own team's dance, with results hidden, then both teams after joining the other group.
state: run-config.yaml
baseState: ../../../shared-state/system-basic
feature: ../../../../docs/capabilities/features/app/results-own-team-dances.md
scenarios:
  - ../../tests/results.group-member.sees-own-team-dance.mjs
  - ../../tests/results.group-member.hides-unpublished-results.mjs
  - ../../tests/results.group-member.sees-joined-groups-dances.mjs
logins: ../../../shared-data/logins.env.example
---

# View own team dances

This fixture is the [View own team dances](../../../../docs/capabilities/features/app/results-own-team-dances.md) feature. Each test in the front matter is one scenario from that page. It runs on one signed-in session against [system-basic](../../../shared-state/system-basic).

Before the browser opens, the group-member persona's `groupmember` claim is put back to the single group in [auth0-personas.json](../../../shared-data/auth0-personas.json).

The screen is the iPhone SE size in [device.mjs](../../config/device.mjs). The group member email and password are `DERTINFO_E2E_GROUP_MEMBER_EMAIL` and `DERTINFO_E2E_GROUP_MEMBER_PASSWORD` in [logins.env](../../../shared-data/logins.env.example).

The wider dance list is meant to appear as soon as the pin is saved. Until [issue 149](https://github.com/dertinfo-org/dertinfo-mono/issues/149) is fixed, `results.group-member.sees-joined-groups-dances` signs out and signs in again before it opens the dances. Remove that sign-in when the issue is fixed.
