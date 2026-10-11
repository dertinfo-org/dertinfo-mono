---
title: Confirm registrations
type: fixture
status: active
updated: 2026-10-11
id: registration.confirm
summary: An event administrator confirms a submitted registration.
state: run-config.yaml
baseState: none
feature: ../../../../docs/capabilities/features/web/registration-confirm.md
scenarios:
  - ../../tests/registration.event-admin.confirms.mjs
---

# Confirm registrations

This fixture is the [Confirm registrations](../../../../docs/capabilities/features/web/registration-confirm.md) feature. It runs [registration.event-admin.confirms](../../tests/registration.event-admin.confirms.mjs). `requires` is `registration.submit`.
