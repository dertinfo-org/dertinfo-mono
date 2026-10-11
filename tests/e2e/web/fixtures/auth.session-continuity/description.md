---
title: Stay signed in
type: fixture
status: active
updated: 2026-10-11
id: auth.session-continuity
summary: A rejected cache returns the visitor to sign-in.
state: run-config.yaml
baseState: none
feature: ../../../../docs/capabilities/features/web/auth-session-continuity.md
scenarios:
  - ../../tests/auth.session-continuity.rejected-cache-returns-to-sign-in.mjs
---

# Stay signed in

This fixture is the [Stay signed in](../../../../docs/capabilities/features/web/auth-session-continuity.md) feature. It runs [Rejected cache returns to sign-in](../../tests/auth.session-continuity.rejected-cache-returns-to-sign-in.mjs). `requires` is empty. The smoke command does not run this fixture.
