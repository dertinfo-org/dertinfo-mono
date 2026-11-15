---
title: Join a group with a pin
type: fixture
status: active
updated: 2026-11-15
id: groups.join-by-pin
summary: A group member signs in, sees their current group, rejects an unknown pin, and joins a second group.
state: run-config.yaml
baseState: ../../../shared-state/system-basic
feature: ../../../../docs/capabilities/features/app/groups-join-by-pin.md
scenarios:
  - ../../tests/groups.group-member.sees-current-group.mjs
  - ../../tests/groups.group-member.rejects-unknown-pin.mjs
  - ../../tests/groups.group-member.joins-second-group.mjs
logins: ../../../shared-data/logins.env.example
---

# Join a group with a pin

This fixture is the [Join a group with a pin](../../../../docs/capabilities/features/app/groups-join-by-pin.md) feature. Each test in the front matter is one scenario from that page. It runs on one signed-in session against [system-basic](../../../shared-state/system-basic).

Before the browser opens, the group-member persona's `groupmember` claim is put back to the single group in [auth0-personas.json](../../../shared-data/auth0-personas.json). A previous run leaves the second group on that user.

The screen is the iPhone SE size in [device.mjs](../../config/device.mjs). The group member email and password are `DERTINFO_E2E_GROUP_MEMBER_EMAIL` and `DERTINFO_E2E_GROUP_MEMBER_PASSWORD` in [logins.env](../../../shared-data/logins.env.example).

Saving a valid pin is meant to show the new group without another sign-in. Until [issue 149](https://github.com/dertinfo-org/dertinfo-mono/issues/149) is fixed, `groups.group-member.joins-second-group` signs out and signs in again before it checks the profile. Remove that sign-in when the issue is fixed.
