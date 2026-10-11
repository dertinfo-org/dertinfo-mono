---
title: Submit event registration
type: fixture
status: active
updated: 2026-10-11
id: registration.submit
summary: A group administrator registers the group for an event, submits, and amends that registration.
state: run-config.yaml
baseState: none
feature: ../../../../docs/capabilities/features/web/registration-submit.md
scenarios:
  - ../../tests/registration.groupadmin.registerforevent-scenario1.mjs
  - ../../tests/registration.groupadmin.amends-submitted.mjs
---

# Submit event registration

This fixture is the [Submit event registration](../../../../docs/capabilities/features/web/registration-submit.md) feature. `requires` is `events.create, groups.manage`. `baseState` is `none`, so a run does not remove the event and the group.
