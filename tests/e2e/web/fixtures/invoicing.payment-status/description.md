---
title: Invoicing and payment status
type: fixture
status: active
updated: 2026-10-11
id: invoicing.payment-status
summary: An event administrator and a group administrator review the invoice for a confirmed registration.
state: run-config.yaml
baseState: none
feature: ../../../../docs/capabilities/features/web/invoicing.md
scenarios:
  - ../../tests/invoicing.event-admin.reviews.mjs
  - ../../tests/invoicing.group-admin.reviews.mjs
---

# Invoicing and payment status

This fixture is the [Invoicing and payment status](../../../../docs/capabilities/features/web/invoicing.md) feature. `requires` is `registration.confirm`.
