---
title: Create and manage group
type: fixture
status: active
updated: 2026-10-11
id: groups.manage
summary: A group administrator creates and configures a group.
state: run-config.yaml
baseState: ../../../shared-state/system-empty
feature: ../../../../docs/capabilities/features/web/groups-manage.md
scenarios:
  - ../../tests/group.groupadmin.createandconfigure-scenario1.mjs
---

# Create and manage group

This fixture is the [Create and manage group](../../../../docs/capabilities/features/web/groups-manage.md) feature. It runs [group.groupadmin.createandconfigure-scenario1](../../tests/group.groupadmin.createandconfigure-scenario1.mjs), which still covers several scenarios in that feature. `requires` is `public.cookie-consent`. It does not require the event fixture.
