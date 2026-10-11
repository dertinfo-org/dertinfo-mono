---
title: Create event
type: fixture
status: active
updated: 2026-10-11
id: events.create
summary: An event administrator creates and configures an event.
state: run-config.yaml
baseState: ../../../shared-state/system-empty
feature: ../../../../docs/capabilities/features/web/events-create.md
scenarios:
  - ../../tests/event.eventadmin.createandconfigure-scenario1.mjs
---

# Create event

This fixture is the [Create event](../../../../docs/capabilities/features/web/events-create.md) feature. It runs [event.eventadmin.createandconfigure-scenario1](../../tests/event.eventadmin.createandconfigure-scenario1.mjs), which still covers several scenarios in that feature. `requires` is `public.cookie-consent`.
