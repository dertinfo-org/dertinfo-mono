---
title: Cookie consent
type: fixture
status: active
updated: 2026-10-11
id: public.cookie-consent
summary: A visitor accepts the cookie banner.
state: run-config.yaml
baseState: ../../../shared-state/system-empty
feature: ../../../../docs/capabilities/features/web/cookie-consent.md
scenarios:
  - ../../tests/public.cookie-consent.visitor-accepts.mjs
---

# Cookie consent

This fixture is the [Cookie consent](../../../../docs/capabilities/features/web/cookie-consent.md) feature. It runs one test, [Visitor accepts cookies](../../tests/public.cookie-consent.visitor-accepts.mjs). `requires` is empty. A full smoke run leaves this session in place so later fixtures can copy the cookie.
